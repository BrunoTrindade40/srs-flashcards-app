import { ForbiddenException, Injectable } from '@nestjs/common';
import { Flashcard as PrismaFlashcard, CardFSRSData, User } from '@prisma/client';
import { createEmptyCard, FSRS, Card as FSRSCard, Grade, RecordLogItem } from 'ts-fsrs';
import { PrismaService } from '../../prisma/prisma.service';
import { ANONYMIZED_PAYLOAD, STUDY_MODE } from '../common/constants/domain.constants';
import { RolloverService } from '../common/services/rollover.service';

// -----------------------------------------------------------------------------
// FUNÇÕES PURAS (Stateless) - Isolamento de Domínio e Otimização de Memória
// -----------------------------------------------------------------------------

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const RATING_XP_MAP: Record<number, number> = {
  1: 3,
  2: 5,
  3: 10,
  4: 15,
};

const computeNextFsrsState = (
  rating: number,
  fsrsDataRecord: CardFSRSData | null,
  fsrsWeights: any,
): RecordLogItem => {
  let activeFsrs = new FSRS({});
  if (fsrsWeights && Array.isArray(fsrsWeights)) {
    activeFsrs = new FSRS({ w: fsrsWeights as number[] });
  }

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

  return activeFsrs.next(currentFsrsCard, new Date(), rating as Grade);
};

// -----------------------------------------------------------------------------
// SERVIÇO PRINCIPAL - Focado em Orquestração e Transações (SRP)
// -----------------------------------------------------------------------------

@Injectable()
export class StudyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rolloverService: RolloverService,
  ) {}

  /**
   * RF04: Construção rigorosa da Fila de Estudos diária (Fase 1 - MVP).
   */
  async dueFlashcards(userId: string, deckId: string): Promise<PrismaFlashcard[]> {
    await this.validateEnrollmentAccess(userId, deckId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dailyNewCardLimit: true, maxDailyReviews: true, timezone: true },
    });

    const baseNewCardLimit = user?.dailyNewCardLimit ?? 20;
    const maxDailyReviews = user?.maxDailyReviews ?? 100;
    const defaultTz = user?.timezone ?? 'America/Sao_Paulo';
    
    const { start: todayStart, end: rolloverThreshold } = this.rolloverService.getStudyDayBounds(defaultTz);

    const overdueCards = await this.fetchOverdueCards(userId, deckId, rolloverThreshold);
    const newCards = await this.fetchNewCards(userId, deckId, todayStart, maxDailyReviews, baseNewCardLimit, overdueCards.length);

    return shuffleArray([...overdueCards, ...newCards]);
  }

  /**
   * RF05: Avaliação de Retenção (FSRS) + Transação Atômica + Gamificação
   */
  async submitReview(userId: string, flashcardId: string, rating: number, reviewDurationMs: number): Promise<boolean> {
    if (![1, 2, 3, 4].includes(rating)) {
      throw new ForbiddenException('Avaliação inválida. Use 1 (Again) a 4 (Easy).');
    }

    const sanitizedDurationMs = Math.max(0, Math.min(Math.round(reviewDurationMs), 60000));
    await this.validateFlashcardAccess(flashcardId, userId);

    const [fsrsDataRecord, userRecord] = await Promise.all([
      this.prisma.cardFSRSData.findUnique({ where: { flashcardId_userId: { flashcardId, userId } } }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { fsrsWeights: true, timezone: true, currentStreak: true, longestStreak: true },
      }),
    ]);

    const userTz = userRecord?.timezone ?? 'America/Sao_Paulo';
    const { start: todayStart } = this.rolloverService.getStudyDayBounds(userTz);

    // 1. Extração Isolada da Lógica de Gamificação
    const streakData = await this.resolveStreak(userId, userRecord, todayStart);
    const gainedXp = RATING_XP_MAP[rating] ?? 0;

    // 2. Extração Isolada da Lógica Matemática do FSRS
    const reviewResult = computeNextFsrsState(rating, fsrsDataRecord, userRecord?.fsrsWeights);
    const nextState = reviewResult.card;

    // 3. Orquestração Pura da Transação no Banco de Dados
    await this.executeReviewTransaction(
      userId, flashcardId, rating, sanitizedDurationMs, nextState, fsrsDataRecord, gainedXp, streakData
    );

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

    const chaosTz = user?.timezone ?? 'America/Sao_Paulo';
    const { end: rolloverThreshold } = this.rolloverService.getStudyDayBounds(chaosTz);

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

    return shuffleArray(dueFsrsRecords.map((r) => r.flashcard));
  }

  // -----------------------------------------------------------------------------
  // MÉTODOS PRIVADOS AUXILIARES (Delegação e Legibilidade)
  // -----------------------------------------------------------------------------

  private async validateEnrollmentAccess(userId: string, deckId: string): Promise<void> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, deckId, status: 'ACTIVE', deck: { isArchived: false } },
    });
    if (!enrollment) throw new ForbiddenException('Acesso negado: Matrícula inativa ou Baralho arquivado.');
  }

  private async validateFlashcardAccess(flashcardId: string, userId: string): Promise<void> {
    const flashcard = await this.prisma.flashcard.findFirst({
      where: { id: flashcardId, deck: { enrollments: { some: { userId, status: 'ACTIVE' } } } },
    });
    if (!flashcard) throw new ForbiddenException('Cartão não encontrado ou matrícula inativa.');
  }

  private async fetchOverdueCards(userId: string, deckId: string, threshold: Date) {
    const overdueFsrsRecords = await this.prisma.cardFSRSData.findMany({
      where: {
        userId,
        due: { lte: threshold },
        state: { in: [1, 2, 3] },
        flashcard: { deckId, frontContent: { not: ANONYMIZED_PAYLOAD }, isPublished: true },
      },
      orderBy: { due: 'asc' },
      include: { flashcard: true },
    });
    return overdueFsrsRecords.map((record) => record.flashcard);
  }

  private async fetchNewCards(userId: string, deckId: string, todayStart: Date, maxDaily: number, baseLimit: number, overdueCount: number) {
    const distinctCardsReviewedToday = await this.prisma.reviewLog.groupBy({
      by: ['flashcardId'],
      where: { userId, createdAt: { gte: todayStart } },
    });

    const newCardsIntroducedToday = await this.prisma.reviewLog.groupBy({
      by: ['flashcardId'],
      where: { userId, createdAt: { gte: todayStart }, stabilityBefore: 0 },
    });

    const totalWorkloadToday = distinctCardsReviewedToday.length + overdueCount;
    const remainingTotalQuota = Math.max(0, maxDaily - totalWorkloadToday);
    const remainingNewQuota = Math.max(0, baseLimit - newCardsIntroducedToday.length);
    const allowedNewCards = Math.min(remainingTotalQuota, remainingNewQuota);

    if (allowedNewCards <= 0) return [];

    return this.prisma.flashcard.findMany({
      where: {
        deckId,
        frontContent: { not: ANONYMIZED_PAYLOAD },
        isPublished: true,
        fsrsData: { none: { userId } },
      },
      orderBy: { createdAt: 'asc' },
      take: allowedNewCards,
    });
  }

  private async resolveStreak(userId: string, userRecord: any, todayStart: Date) {
    let current = userRecord?.currentStreak ?? 0;
    let longest = userRecord?.longestStreak ?? 0;
    let isFirstStudyOfDay = false;

    const hasStudiedToday = await this.prisma.reviewLog.findFirst({
      where: { userId, createdAt: { gte: todayStart } },
      select: { id: true },
    });

    if (!hasStudiedToday) {
      isFirstStudyOfDay = true;
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
      const hasStudiedYesterday = await this.prisma.reviewLog.findFirst({
        where: { userId, createdAt: { gte: yesterdayStart, lt: todayStart } },
        select: { id: true },
      });

      current = hasStudiedYesterday ? current + 1 : 1;
      if (current > longest) longest = current;
    }

    return { isFirstStudyOfDay, current, longest };
  }

  private async executeReviewTransaction(
    userId: string, flashcardId: string, rating: number, durationMs: number, 
    nextState: FSRSCard, prevData: CardFSRSData | null, gainedXp: number, streakData: any
  ) {
    await this.prisma.$transaction([
      this.prisma.cardFSRSData.upsert({
        where: { flashcardId_userId: { flashcardId, userId } },
        update: {
          stability: nextState.stability, difficulty: nextState.difficulty, elapsedDays: nextState.elapsed_days,
          scheduledDays: nextState.scheduled_days, reps: nextState.reps, lapses: nextState.lapses,
          state: nextState.state, lastReview: nextState.last_review, due: nextState.due,
        },
        create: {
          flashcardId, userId, stability: nextState.stability, difficulty: nextState.difficulty,
          elapsedDays: nextState.elapsed_days, scheduledDays: nextState.scheduled_days,
          reps: nextState.reps, lapses: nextState.lapses, state: nextState.state,
          lastReview: nextState.last_review, due: nextState.due,
        },
      }),
      this.prisma.reviewLog.create({
        data: {
          flashcardId, userId, rating, reviewDurationMs: durationMs,
          studyMode: STUDY_MODE.STANDARD, state: prevData?.state ?? 0,
          stabilityBefore: prevData?.stability ?? 0, stabilityAfter: nextState.stability,
          difficultyBefore: prevData?.difficulty ?? 0, difficultyAfter: nextState.difficulty,
          elapsedDays: nextState.elapsed_days, scheduledDays: nextState.scheduled_days,
          due: prevData?.due ?? new Date(), version: 1, reps: nextState.reps, lapses: nextState.lapses,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          totalXp: { increment: gainedXp },
          ...(streakData.isFirstStudyOfDay && { currentStreak: streakData.current, longestStreak: streakData.longest }),
        },
      }),
    ]);
  }
}