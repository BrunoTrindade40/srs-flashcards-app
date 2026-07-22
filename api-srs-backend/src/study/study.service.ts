import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Flashcard as PrismaFlashcard } from '@prisma/client';
import { createEmptyCard, FSRS, Card as FSRSCard, Rating } from 'ts-fsrs';
import { PrismaService } from '../../prisma/prisma.service';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class StudyService {
  // Inicialização do Motor FSRS Oficial
  // CORREÇÃO 1: Na versão 5+, o construtor exige um argumento. Passar {} aplica os pesos padrão da rede neural.
  private fsrs = new FSRS({});

  constructor(private readonly prisma: PrismaService) { }

  /**
   * UTILITÁRIO: Calcula o início do "Dia de Estudo" (RN06)
   * O sistema considera o início de um novo dia às 04:00 AM do horário local do usuário.
   */
  private getStartOfStudyDay(userTimezone: string = 'America/Sao_Paulo'): Date {
    let localTime = dayjs().tz(userTimezone);

    // Se ainda não deu 04:00 AM, consideramos que ainda é o "dia anterior" de estudos
    if (localTime.hour() < 4) {
      localTime = localTime.subtract(1, 'day');
    }

    // Zera os relógios para 04:00:00 do dia correto
    return localTime.hour(4).minute(0).second(0).millisecond(0).toDate();
  }

  /**
   * RF04: Motor de Sessão de Estudo
   */
  async dueFlashcards(
    userId: string,
    deckId: string,
  ): Promise<PrismaFlashcard[]> {
    const deck = await this.prisma.deck.findUnique({
      where: { id: deckId },
      select: { creatorId: true },
    });

    if (!deck || deck.creatorId !== userId) {
      throw new ForbiddenException('Acesso negado ao Deck.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dailyNewCardLimit: true, maxDailyReviews: true, timezone: true },
    });

    const baseNewCardLimit = user?.dailyNewCardLimit ?? 20;
    const maxDailyReviews = user?.maxDailyReviews ?? 100;
    const now = new Date();

    const todayStart = this.getStartOfStudyDay(user?.timezone);

    const distinctCardsReviewedToday = await this.prisma.reviewLog.findMany({
      where: { userId, createdAt: { gte: todayStart } },
      select: { flashcardId: true },
      distinct: ['flashcardId'],
    });

    const reviewsDoneToday = distinctCardsReviewedToday.length;
    const remainingReviewsQuota = Math.max(0, maxDailyReviews - reviewsDoneToday);

    // 1. FILA CRÍTICA
    const criticalCards = await this.prisma.flashcard.findMany({
      where: {
        deckId: deckId,
        front: { not: '[DADO_ANONIMIZADO]' },
        fsrsData: { some: { userId, due: { lte: now }, state: { in: [1, 3] } } },
      },
      include: { fsrsData: { where: { userId } } },
    });

    let reviewCards: PrismaFlashcard[] = [];
    let effectiveNewCardLimit = baseNewCardLimit;

    // 2. FILA DE REVISÃO
    if (remainingReviewsQuota > 0) {
      const pendingReviewsCount = await this.prisma.flashcard.count({
        where: {
          deckId: deckId,
          front: { not: '[DADO_ANONIMIZADO]' },
          fsrsData: { some: { userId, due: { lte: now }, state: 2 } },
        },
      });

      if (pendingReviewsCount >= maxDailyReviews) {
        effectiveNewCardLimit = 0;
      } else if (pendingReviewsCount > (maxDailyReviews * 0.8)) {
        effectiveNewCardLimit = Math.min(baseNewCardLimit, maxDailyReviews - pendingReviewsCount);
      }

      reviewCards = await this.prisma.flashcard.findMany({
        where: {
          deckId: deckId,
          front: { not: '[DADO_ANONIMIZADO]' },
          fsrsData: { some: { userId, due: { lte: now }, state: 2 } },
        },
        include: { fsrsData: { where: { userId } } },
        take: remainingReviewsQuota,
      });
    } else {
      effectiveNewCardLimit = 0;
    }

    // 3. FILA DE NOVOS CARTÕES
    let newCards: PrismaFlashcard[] = [];
    if (effectiveNewCardLimit > 0) {
      newCards = await this.prisma.flashcard.findMany({
        where: {
          deckId: deckId,
          front: { not: '[DADO_ANONIMIZADO]' },
          OR: [
            { fsrsData: { none: { userId } } },
            { fsrsData: { some: { userId, state: 0 } } }
          ]
        },
        include: { fsrsData: { where: { userId } } },
        take: effectiveNewCardLimit,
      });
    }

    const combinedQueue: PrismaFlashcard[] = [...criticalCards, ...reviewCards, ...newCards];

    for (let i = combinedQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combinedQueue[i], combinedQueue[j]] = [combinedQueue[j], combinedQueue[i]];
    }

    return combinedQueue;
  }

  /**
   * RF05: Avaliação de Retenção - Usando a Biblioteca FSRS Matemática Oficial
   */
  async submitReview(
    userId: string,
    flashcardId: string,
    rating: number, // 1: Errei, 2: Difícil, 3: Bom, 4: Fácil
    reviewDurationMs: number,
  ): Promise<boolean> {

    const validRatings = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];
    if (!validRatings.includes(rating)) {
      throw new ForbiddenException('Avaliação inválida. Use 1 (Again) a 4 (Easy).');
    }

    const flashcard = await this.prisma.flashcard.findUnique({
      where: { id: flashcardId },
      include: { deck: { select: { creatorId: true } } },
    });

    if (!flashcard || flashcard.deck.creatorId !== userId) {
      throw new ForbiddenException('Cartão não encontrado ou acesso negado.');
    }

    const fsrsDataRecord = await this.prisma.cardFSRSData.findUnique({
      where: { flashcardId_userId: { flashcardId, userId } }
    });

    let currentFsrsCard: FSRSCard;

    if (!fsrsDataRecord) {
      currentFsrsCard = createEmptyCard();
    } else {
      // CORREÇÃO 2: Utilizamos a sintaxe de Espalhamento (Spread: ...createEmptyCard())
      // Isso injeta propriedades nativas como 'learning_steps' e previne erros de tipagem da V5.
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

    // CORREÇÃO 3: Substituição do repeat() pelo next().
    // O método next() foca especificamente no rating passado e não cria a chave IPreview indexada dinamicamente,
    // eliminando as queixas do 'Unsafe member access' no modo strict.
    const reviewResult = this.fsrs.next(currentFsrsCard, now, rating);
    const nextState = reviewResult.card;

    const sanitizedDurationMs = Math.min(reviewDurationMs, 60000);

    // Persistência em Transação (Atomicidade)
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
        }
      }),
      this.prisma.reviewLog.create({
        data: {
          flashcardId,
          userId,
          rating,
          reviewDurationMs: sanitizedDurationMs,
          elapsedDays: nextState.elapsed_days,
          stabilityBefore: currentFsrsCard.stability,
          difficultyBefore: currentFsrsCard.difficulty,
          stabilityAfter: nextState.stability,
          difficultyAfter: nextState.difficulty,
          isFatiguedReview: false
        },
      }),
    ]);

    return true;
  }
}