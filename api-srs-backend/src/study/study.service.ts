import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, Flashcard as PrismaFlashcard } from '@prisma/client';
// 🔴 CORREÇÃO CRÍTICA: Importação do tipo 'Grade' em vez de 'Rating'
import { createEmptyCard, FSRS, Card as FSRSCard, Grade } from 'ts-fsrs';
import { PrismaService } from '../../prisma/prisma.service';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { ANONYMIZED_PAYLOAD, STUDY_MODE } from '../common/constants/domain.constants';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class StudyService {
  private readonly fsrs = new FSRS({});

  constructor(private readonly prisma: PrismaService) {}

  private getRolloverThreshold(userTimezone: string = 'America/Sao_Paulo'): Date {
    return dayjs().tz(userTimezone).endOf('day').toDate();
  }

  private getStartOfStudyDay(userTimezone: string = 'America/Sao_Paulo'): Date {
    let localTime = dayjs().tz(userTimezone);
    // Se ainda não passou das 04:00 da manhã, o "dia de estudo" pertence a ontem
    if (localTime.hour() < 4) {
      localTime = localTime.subtract(1, 'day');
    }
    return localTime.hour(4).minute(0).second(0).millisecond(0).toDate();
  }

  /**
   * RF04: Construção rigorosa da Fila de Estudos diária (Fase 1 - MVP).
   */
  async dueFlashcards(userId: string, deckId: string): Promise<PrismaFlashcard[]> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        deckId,
        status: 'ACTIVE',
        deck: { isArchived: false },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('Acesso negado: Matrícula inativa ou Baralho arquivado.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dailyNewCardLimit: true, maxDailyReviews: true, timezone: true },
    });

    const baseNewCardLimit = user?.dailyNewCardLimit ?? 20;
    const maxDailyReviews = user?.maxDailyReviews ?? 100;
    const rolloverThreshold = this.getRolloverThreshold(user?.timezone);
    const todayStart = this.getStartOfStudyDay(user?.timezone);

    // 🔴 REGRA 1: DÍVIDA COGNITIVA É INEGOCIÁVEL (Sem limite de 'take')
    // Busca todos os cartões que estão vencendo hoje e que já foram vistos (LEARNING, REVIEW, RELEARNING)
    const overdueFsrsRecords = await this.prisma.cardFSRSData.findMany({
      where: {
        userId,
        due: { lte: rolloverThreshold },
        state: { in: [1, 2, 3] }, // Nunca bloqueie cartões nestes estados
        flashcard: { deckId, frontContent: { not: ANONYMIZED_PAYLOAD }, isPublished: true },
      },
      orderBy: { due: 'asc' },
      include: { flashcard: true },
    });

    const overdueCards = overdueFsrsRecords.map((record) => record.flashcard);

    // 🔴 REGRA 2: FIREWALL DE CARTÕES NOVOS (O Bloqueio Real)
    // Calcula quantos cartões o usuário já fez hoje e soma com a dívida pendente
    const distinctCardsReviewedToday = await this.prisma.reviewLog.groupBy({
      by: ['flashcardId'],
      where: { userId, createdAt: { gte: todayStart } },
    });
    
    const totalWorkloadToday = distinctCardsReviewedToday.length + overdueCards.length;
    // Zero Trust Math: Se a carga de trabalho total (feita + pendente) for maior
    // que o maxDailyReviews, o Math.max garante que o remainingTotalQuota seja 0.
    const remainingTotalQuota = Math.max(0, maxDailyReviews - totalWorkloadToday);

    // Contagem de cartões virgens introduzidos hoje (para o limite de novos)
    const newCardsIntroducedToday = await this.prisma.reviewLog.groupBy({
      by: ['flashcardId'],
      where: { userId, createdAt: { gte: todayStart }, stabilityBefore: 0 },
    });
    const remainingNewQuota = Math.max(0, baseNewCardLimit - newCardsIntroducedToday.length);

    // A Injeção de Cartões Novos só ocorre se ambas as cotas permitirem.
    const allowedNewCards = Math.min(remainingTotalQuota, remainingNewQuota);

    // 3. FASE C: Injeção de Cartões Novos
    let newCards: PrismaFlashcard[] = [];
    if (allowedNewCards > 0) {
      newCards = await this.prisma.flashcard.findMany({
        where: {
          deckId,
          frontContent: { not: ANONYMIZED_PAYLOAD },
          isPublished: true,
          fsrsData: { none: { userId } }, // Estado NEW implícito
        },
        orderBy: { createdAt: 'asc' },
        take: allowedNewCards, // 🔴 Aplicação estrita da trava de segurança apenas aqui
      });
    }

    // Combina e embaralha para evitar a decoreba posicional (Desirable Difficulties)
    return this.shuffleArray([...overdueCards, ...newCards]);
  }

  /**
   * RF05: Avaliação de Retenção (FSRS) + Transação Atômica + Gamificação
   */
  async submitReview(userId: string, flashcardId: string, rating: number, reviewDurationMs: number): Promise<boolean> {
    const validRatings = [1, 2, 3, 4];
    if (!validRatings.includes(rating)) {
      throw new ForbiddenException('Avaliação inválida. Use 1 (Again) a 4 (Easy).');
    }
    
    // Grampo de latência (Imune a travamentos no Event Loop do navegador)
    const sanitizedDurationMs = Math.max(0, Math.min(Math.round(reviewDurationMs), 60000));

    const flashcard = await this.prisma.flashcard.findFirst({
      where: {
        id: flashcardId,
        deck: { enrollments: { some: { userId, status: 'ACTIVE' } } },
      },
    });

    if (!flashcard) throw new ForbiddenException('Cartão não encontrado ou matrícula inativa.');

    const [fsrsDataRecord, userRecord] = await Promise.all([
      this.prisma.cardFSRSData.findUnique({
        where: { flashcardId_userId: { flashcardId, userId } },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { fsrsWeights: true, timezone: true, currentStreak: true, longestStreak: true },
      }),
    ]);

    // Gestão de Ofensiva (Streaks)
    let nextCurrentStreak = userRecord?.currentStreak ?? 0;
    let nextLongestStreak = userRecord?.longestStreak ?? 0;
    let isFirstStudyOfDay = false;

    const todayStart = this.getStartOfStudyDay(userRecord?.timezone);
    const hasStudiedToday = await this.prisma.reviewLog.findFirst({
      where: { userId, createdAt: { gte: todayStart } },
      select: { id: true },
    });

    if (!hasStudiedToday) {
      isFirstStudyOfDay = true;
      const yesterdayStart = dayjs(todayStart).subtract(1, 'day').toDate();
      const hasStudiedYesterday = await this.prisma.reviewLog.findFirst({
        where: { userId, createdAt: { gte: yesterdayStart, lt: todayStart } },
        select: { id: true },
      });

      nextCurrentStreak = hasStudiedYesterday ? nextCurrentStreak + 1 : 1;
      if (nextCurrentStreak > nextLongestStreak) nextLongestStreak = nextCurrentStreak;
    }

    const gainedXp = rating === 1 ? 3 : rating === 2 ? 5 : rating === 3 ? 10 : 15;

    let activeFsrs = this.fsrs;
    if (userRecord?.fsrsWeights && Array.isArray(userRecord.fsrsWeights)) {
      activeFsrs = new FSRS({ w: userRecord.fsrsWeights as number[] });
    }

    // Hidratação do Estado FSRS atual
    const currentFsrsCard: FSRSCard = !fsrsDataRecord 
      ? createEmptyCard() 
      : {
          ...createEmptyCard(),
          due: fsrsDataRecord.due,
          stability: fsrsDataRecord.stability,
          difficulty: fsrsDataRecord.difficulty,
          elapsed_days: fsrsDataRecord.elapsedDays,
          scheduled_days: fsrsDataRecord.scheduledDays,
          reps: fsrsDataRecord.reps,
          lapses: fsrsDataRecord.lapses,
          state: fsrsDataRecord.state,
          last_review: fsrsDataRecord.lastReview || undefined,
        };

    // Cálculos Estocásticos via Rede Neural
    const now = new Date();
    // 🔴 CORREÇÃO CRÍTICA: Cast atualizado para 'Grade' satisfazendo a assinatura do ts-fsrs v5.4.1
    const reviewResult = activeFsrs.next(currentFsrsCard, now, rating as Grade);
    const nextState = reviewResult.card;

    // Transação Atômica: Se falhar em um, falha em todos (Segurança de Consistência)
    await this.prisma.$transaction([
      this.prisma.cardFSRSData.upsert({
        where: { flashcardId_userId: { flashcardId, userId } },
        update: {
          stability: nextState.stability,
          difficulty: nextState.difficulty,
          elapsedDays: nextState.elapsed_days,
          scheduledDays: nextState.scheduled_days,
          reps: nextState.reps,
          lapses: nextState.lapses,
          state: nextState.state,
          lastReview: nextState.last_review,
          due: nextState.due,
        },
        create: {
          flashcardId,
          userId,
          stability: nextState.stability,
          difficulty: nextState.difficulty,
          elapsedDays: nextState.elapsed_days,
          scheduledDays: nextState.scheduled_days,
          reps: nextState.reps,
          lapses: nextState.lapses,
          state: nextState.state,
          lastReview: nextState.last_review,
          due: nextState.due,
        },
      }),
      this.prisma.reviewLog.create({
        data: {
          flashcardId,
          userId,
          rating,
          reviewDurationMs: sanitizedDurationMs,
          studyMode: STUDY_MODE.STANDARD,
          state: currentFsrsCard.state,
          stabilityBefore: currentFsrsCard.stability,
          stabilityAfter: nextState.stability,
          difficultyBefore: currentFsrsCard.difficulty,
          difficultyAfter: nextState.difficulty,
          elapsedDays: nextState.elapsed_days,
          scheduledDays: nextState.scheduled_days,
          due: currentFsrsCard.due,
          version: 1,
          reps: nextState.reps,
          lapses: nextState.lapses,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          totalXp: { increment: gainedXp },
          ...(isFirstStudyOfDay && { currentStreak: nextCurrentStreak, longestStreak: nextLongestStreak }),
        },
      }),
    ]);

    return true;
  }

  /**
   * UC10 - Modo Chaos (Interleaving)
   */
  async getChaosStudyQueue(userId: string, limit: number = 50): Promise<PrismaFlashcard[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });

    const rolloverThreshold = this.getRolloverThreshold(user?.timezone);

    const dueFsrsRecords = await this.prisma.cardFSRSData.findMany({
      where: {
        userId: userId,
        due: { lte: rolloverThreshold },
        state: { not: 0 },
        flashcard: {
          frontContent: { not: ANONYMIZED_PAYLOAD },
          deck: {
            isArchived: false,
            enrollments: { some: { userId, status: 'ACTIVE' } },
          },
        },
      },
      include: { flashcard: true },
      orderBy: { due: 'asc' },
      take: limit,
    });

    return this.shuffleArray(dueFsrsRecords.map((r) => r.flashcard));
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}