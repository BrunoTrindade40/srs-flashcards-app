import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, Flashcard as PrismaFlashcard } from '@prisma/client';
import { createEmptyCard, FSRS, Card as FSRSCard } from 'ts-fsrs';
import { PrismaService } from '../../prisma/prisma.service';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { ANONYMIZED_PAYLOAD, STUDY_MODE } from '../common/constants/domain.constants';

dayjs.extend(utc);
dayjs.extend(timezone);

type FSRSRecordWithFlashcard = Prisma.CardFSRSDataGetPayload<{
  include: { flashcard: { include: { deck: true } } };
}>;

@Injectable()
export class StudyService {
  private readonly fsrs = new FSRS({});

  constructor(private readonly prisma: PrismaService) {}

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
    return records.map((record) => record.flashcard);
  }

  /**
   * RF04: Construção rigorosa da Fila de Estudos diária (Fase 1 - MVP).
   */
  async dueFlashcards(
    userId: string,
    deckId: string,
  ): Promise<PrismaFlashcard[]> {
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

    // 🟡 ALERTA CORRIGIDO: Adição de `isPublished: true` para ignorar rascunhos na Fila de Estudos
    const criticalRecords = await this.prisma.cardFSRSData.findMany({
      where: {
        userId,
        due: { lte: rolloverThreshold },
        state: { in: [1, 3] },
        flashcard: { deckId, frontContent: { not: ANONYMIZED_PAYLOAD }, isPublished: true },
      },
      orderBy: { due: 'asc' },
      include: { flashcard: { include: { deck: true } } },
    });

    const reviewRecords = await this.prisma.cardFSRSData.findMany({
      where: {
        userId,
        due: { lte: rolloverThreshold },
        state: 2,
        flashcard: { deckId, frontContent: { not: ANONYMIZED_PAYLOAD }, isPublished: true },
      },
      orderBy: { due: 'asc' },
      include: { flashcard: { include: { deck: true } } },
    });

    const distinctCardsReviewedToday = await this.prisma.reviewLog.groupBy({
      by: ['flashcardId'],
      where: { userId, createdAt: { gte: todayStart } },
    });

    const reviewsDoneToday = distinctCardsReviewedToday.length;
    const pendingReviewsCount = criticalRecords.length + reviewRecords.length;
    const totalWorkloadToday = reviewsDoneToday + pendingReviewsCount;

    let effectiveNewCardLimit = baseNewCardLimit;
    if (totalWorkloadToday >= maxDailyReviews) {
      effectiveNewCardLimit = 0;
    } else if (totalWorkloadToday > maxDailyReviews * 0.8) {
      effectiveNewCardLimit = Math.min(baseNewCardLimit, maxDailyReviews - totalWorkloadToday);
    }

    // 🔵 SUGESTÃO APLICADA: Inicializamos a fila base (critical + review)
    const combinedQueue: PrismaFlashcard[] = [
      ...this.mapFsrsToCard(criticalRecords),
      ...this.mapFsrsToCard(reviewRecords),
    ];

    if (effectiveNewCardLimit > 0) {
      const cardsIntroducedToday = await this.prisma.reviewLog.groupBy({
        by: ['flashcardId'],
        where: {
          userId,
          createdAt: { gte: todayStart },
          stabilityBefore: 0,
        },
      });

      const remainingNewQuota = Math.max(0, effectiveNewCardLimit - cardsIntroducedToday.length);
      
      if (remainingNewQuota > 0) {
        // Busca cartões virgens e insere DIRETAMENTE na fila combinada
        const rawNewFlashcards = await this.prisma.flashcard.findMany({
          where: {
            deckId,
            frontContent: { not: ANONYMIZED_PAYLOAD },
            isPublished: true, // 🟡 Impede que flashcards em rascunho vazem como novos
            fsrsData: { none: { userId } },
          },
          orderBy: { createdAt: 'asc' },
          take: remainingNewQuota,
        });

        // Como removemos o "include: { deck: true }", o tipo retornado bate 100% com PrismaFlashcard
        combinedQueue.push(...rawNewFlashcards);
      }
    }

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
    const validRatings = [1, 2, 3, 4];
    if (!validRatings.includes(rating)) {
      throw new ForbiddenException('Avaliação inválida. Use 1 (Again) a 4 (Easy).');
    }
    const sanitizedDurationMs = Math.max(0, Math.min(Math.round(reviewDurationMs), 60000));

    const flashcard = await this.prisma.flashcard.findFirst({
      where: {
        id: flashcardId,
        deck: {
          enrollments: {
            some: { userId, status: 'ACTIVE' },
          },
        },
      },
    });

    if (!flashcard) {
      throw new ForbiddenException('Cartão não encontrado ou estudante não matriculado.');
    }

    const [fsrsDataRecord, userRecord] = await Promise.all([
      this.prisma.cardFSRSData.findUnique({
        where: { flashcardId_userId: { flashcardId, userId } },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { fsrsWeights: true, timezone: true, currentStreak: true, longestStreak: true },
      }),
    ]);

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

    const gainedXp = rating === 1 ? 3 : rating === 2 ? 5 : rating === 3 ? 10 : 15;

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
    const reviewResult = activeFsrs.next(currentFsrsCard, now, rating);
    const nextState = reviewResult.card;

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
          // 🔴 CORREÇÃO CRÍTICA: Substituição do Enum nativo pela constante estrita do TypeScript
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
          frontContent: { not: ANONYMIZED_PAYLOAD },
          deck: {
            isArchived: false,
            enrollments: {
              some: { userId, status: 'ACTIVE' },
            },
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