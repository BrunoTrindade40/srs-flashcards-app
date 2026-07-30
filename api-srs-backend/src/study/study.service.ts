import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Prisma, Flashcard as PrismaFlashcard } from '@prisma/client';
import { createEmptyCard, FSRS, Card as FSRSCard } from 'ts-fsrs';
import { PrismaService } from '../../prisma/prisma.service';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { ANONYMIZED_PAYLOAD } from '../common/constants/domain.constants';

dayjs.extend(utc);
dayjs.extend(timezone);

type FSRSRecordWithFlashcard = Prisma.CardFSRSDataGetPayload<{
  include: { flashcard: { include: { deck: true } } };
}>;

@Injectable()
export class StudyService {
  private fsrs = new FSRS({});

  constructor(private readonly prisma: PrismaService) { }

  private getRolloverThreshold(userTimezone: string = 'America/Sao_Paulo'): Date {
    return dayjs().tz(userTimezone).endOf('day').toDate();
  }

  private getStartOfStudyDay(userTimezone: string = 'America/Sao_Paulo'): Date {
    let localTime = dayjs().tz(userTimezone);
    if (localTime.hour() < 4) {
      localTime = localTime.subtract(1, 'day');
    }
    return localTime.hour(4).minute(0).second(0).millisecond(0).toDate();
  }

  private mapFsrsToCard(records: FSRSRecordWithFlashcard[]): PrismaFlashcard[] {
    return records.map((record) => {
      const { flashcard, ...fsrsMetadata } = record;
      return {
        ...flashcard,
        fsrsData: [fsrsMetadata],
      } as PrismaFlashcard;
    });
  }

  /**
   * RF04: Construção rigorosa da Fila de Estudos diária.
   * A prevenção do Efeito Bola de Neve ocorre ESTRITAMENTE aqui.
   */
  async dueFlashcards(
    userId: string,
    deckId: string,
  ): Promise<PrismaFlashcard[]> {
    const deck = await this.prisma.deck.findUnique({
      where: { id: deckId },
      select: { creatorId: true, isArchived: true },
    });

    if (!deck || deck.creatorId !== userId || deck.isArchived) {
      throw new ForbiddenException('Acesso negado ou Baralho arquivado.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dailyNewCardLimit: true, maxDailyReviews: true, timezone: true },
    });

    const baseNewCardLimit = user?.dailyNewCardLimit ?? 20;
    const maxDailyReviews = user?.maxDailyReviews ?? 100;

    const rolloverThreshold = this.getRolloverThreshold(user?.timezone);
    const todayStart = this.getStartOfStudyDay(user?.timezone);

    // 1. Controle de Revisões Gerais (Gargalo principal)
    const distinctCardsReviewedToday = await this.prisma.reviewLog.groupBy({
      by: ['flashcardId'],
      where: { userId, createdAt: { gte: todayStart } },
    });

    const reviewsDoneToday = distinctCardsReviewedToday.length;
    const remainingReviewsQuota = Math.max(0, maxDailyReviews - reviewsDoneToday);

    // 2. Cartões Críticos (Estados 1 e 3: Learning e Relearning)
    const criticalRecords = await this.prisma.cardFSRSData.findMany({
      where: {
        userId,
        // 🟢 MUDANÇA ESTRATÉGICA:
        // Em vez de 'now', usamos o limite do dia (rolloverThreshold).
        // Se o FSRS agendou o repasse para +5 minutos, mas o aluno quer revisar
        // agora para fechar o app, o sistema puxa o cartão antecipadamente.
        due: { lte: rolloverThreshold },
        state: { in: [1, 3] },
        flashcard: { deckId, front: { not: ANONYMIZED_PAYLOAD } },
      },
      orderBy: { due: 'asc' },
      include: { flashcard: { include: { deck: true } } },
    });

    let reviewRecords: FSRSRecordWithFlashcard[] = [];
    let effectiveNewCardLimit = baseNewCardLimit;

    if (remainingReviewsQuota > 0) {
      const pendingReviewsCount = await this.prisma.cardFSRSData.count({
        where: {
          userId,
          due: { lte: rolloverThreshold },
          state: 2, // Cartões em estágio de Review normal
          flashcard: { deckId, front: { not: ANONYMIZED_PAYLOAD } },
        },
      });

      // Se o passivo de revisões for muito alto, abortamos a inserção de novos cards (Modulação)
      if (pendingReviewsCount >= maxDailyReviews) {
        effectiveNewCardLimit = 0;
      } else if (pendingReviewsCount > (maxDailyReviews * 0.8)) {
        effectiveNewCardLimit = Math.min(baseNewCardLimit, maxDailyReviews - pendingReviewsCount);
      }

      reviewRecords = await this.prisma.cardFSRSData.findMany({
        where: {
          userId,
          due: { lte: rolloverThreshold },
          state: 2,
          flashcard: { deckId, front: { not: ANONYMIZED_PAYLOAD } },
        },
        orderBy: { due: 'asc' },
        take: remainingReviewsQuota,
        include: { flashcard: { include: { deck: true } } },
      });
    } else {
      effectiveNewCardLimit = 0;
    }

    let newRecords: FSRSRecordWithFlashcard[] = [];

    // 3. 🔴 CORREÇÃO CRÍTICA: Subtrair os cartões novos já introduzidos HOJE.
    // O Prisma gera o createdAt do CardFSRSData no momento do primeiro Review.
    const cardsIntroducedToday = await this.prisma.cardFSRSData.count({
      where: {
        userId,
        createdAt: { gte: todayStart },
      },
    });

    const remainingNewQuota = Math.max(0, effectiveNewCardLimit - cardsIntroducedToday);

    if (remainingNewQuota > 0) {
      newRecords = await this.prisma.cardFSRSData.findMany({
        where: {
          userId,
          state: 0,
          flashcard: { deckId, front: { not: ANONYMIZED_PAYLOAD } },
        },
        orderBy: { createdAt: 'asc' },
        take: remainingNewQuota, // O limite estrito é garantido pelo DB
        include: { flashcard: { include: { deck: true } } },
      });
    }

    const combinedQueue: PrismaFlashcard[] = [
      ...this.mapFsrsToCard(criticalRecords),
      ...this.mapFsrsToCard(reviewRecords),
      ...this.mapFsrsToCard(newRecords),
    ];

    return this.shuffleArray(combinedQueue);
  }

  /**
   * RF05: Avaliação de Retenção (FSRS) + Transação Atômica + Gamificação
   */
  async submitReview(
    userId: string,
    flashcardId: string,
    rating: number,
    reviewDurationMs: number,
  ): Promise<boolean> {
    // RESOLUÇÃO DE LINTER (KISS): Usamos Array de números primitivos
    const validRatings = [1, 2, 3, 4];
    if (!validRatings.includes(rating)) {
      throw new ForbiddenException('Avaliação inválida. Use 1 (Again) a 4 (Easy).');
    }

    // 🟡 ALERTA CORRIGIDO: Zero Trust Paradigm.
    // 1. Garantimos que não seja negativo (Math.max com 0).
    // 2. Garantimos que não passe de 1 minuto (Math.min com 60000),
    //    pois um card estudado por 10 minutos seguidos é um _outlier_
    //    que destruiria o treinamento da Rede Neural do FSRS depois.
    // 3. Forçamos a segurança garantindo que seja um Integer no banco.
    const sanitizedDurationMs = Math.max(0, Math.min(Math.round(reviewDurationMs), 60000));

    const flashcard = await this.prisma.flashcard.findUnique({
      where: { id: flashcardId },
      include: { deck: { select: { creatorId: true } } },
    });

    if (!flashcard || flashcard.deck.creatorId !== userId) {
      throw new ForbiddenException('Cartão não encontrado ou acesso negado.');
    }

    // Busca o status do cartão e os dados de perfil do usuário simultaneamente
    const [fsrsDataRecord, userRecord] = await Promise.all([
      this.prisma.cardFSRSData.findUnique({
        where: { flashcardId_userId: { flashcardId, userId } },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { fsrsWeights: true, timezone: true, currentStreak: true, longestStreak: true },
      }),
    ]);

    // --- 1. LÓGICA DE GAMIFICAÇÃO (Ofensiva / XP) ---
    let nextCurrentStreak = userRecord?.currentStreak ?? 0;
    let nextLongestStreak = userRecord?.longestStreak ?? 0;
    let isFirstStudyOfDay = false;

    const todayStart = this.getStartOfStudyDay(userRecord?.timezone || 'America/Sao_Paulo');

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

      if (hasStudiedYesterday) {
        nextCurrentStreak += 1;
      } else {
        nextCurrentStreak = 1;
      }

      if (nextCurrentStreak > nextLongestStreak) {
        nextLongestStreak = nextCurrentStreak;
      }
    }

    // RESOLUÇÃO DE LINTER (KISS): Comparamos diretamente os números (1, 2, 3, 4)
    const gainedXp = rating === 1 ? 3 : rating === 2 ? 5 : rating === 3 ? 10 : 15;

    // --- 2. LÓGICA FSRS ---
    let activeFsrs = this.fsrs;
    if (userRecord?.fsrsWeights && Array.isArray(userRecord.fsrsWeights)) {
      activeFsrs = new FSRS({ w: userRecord.fsrsWeights as number[] });
    }

    let currentFsrsCard: FSRSCard;
    if (!fsrsDataRecord) {
      currentFsrsCard = createEmptyCard();
    } else {
      currentFsrsCard = {
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
    }

    const now = new Date();

    // TYPE ASSERTION SEGURO: Convertemos forçadamente para o Enum apenas na entrega para a lib
    const reviewResult = activeFsrs.next(currentFsrsCard, now, rating);
    const nextState = reviewResult.card;


    // --- 3. A TRANSAÇÃO ATÔMICA ---
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
          rating, // Salvamos o número nativo no banco
          reviewDurationMs: sanitizedDurationMs,
          elapsedDays: nextState.elapsed_days,
          stabilityBefore: currentFsrsCard.stability,
          difficultyBefore: currentFsrsCard.difficulty,
          stabilityAfter: nextState.stability,
          difficultyAfter: nextState.difficulty,
          isFatiguedReview: false,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          totalXp: { increment: gainedXp },
          ...(isFirstStudyOfDay && {
            currentStreak: nextCurrentStreak,
            longestStreak: nextLongestStreak,
          }),
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
          front: { not: ANONYMIZED_PAYLOAD },
          deck: {
            creatorId: userId,
            isArchived: false,
          },
        },
      },
      include: {
        flashcard: {
          include: { deck: true },
        },
      },
      orderBy: { due: 'asc' },
      take: limit,
    });

    return this.shuffleArray(this.mapFsrsToCard(dueFsrsRecords));
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