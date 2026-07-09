import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export enum ReviewRating {
  AGAIN = 1,
  HARD = 2,
  GOOD = 3,
  EASY = 4,
}

// Enumeração baseada no padrão numérico do algoritmo FSRS
export enum CardState {
  NEW = 0,
  LEARNING = 1,
  REVIEW = 2,
  RELEARNING = 3,
}

@Injectable()
export class StudyService {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly prisma: PrismaService) { }

  async getDueFlashcards(deckId: string, requestUserId: string) {
    const now = new Date();

    return this.prisma.flashcard.findMany({
      where: {
        deckId,
        deck: {
          creatorId: requestUserId,
        },
        OR: [{ fsrsData: { due: { lte: now } } }, { fsrsData: null }],
      },
      include: { fsrsData: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async submitReview(
    flashcardId: string,
    requestUserId: string,
    rating: ReviewRating,
  ) {
    const flashcard = await this.prisma.flashcard.findFirst({
      where: {
        id: flashcardId,
        deck: {
          creatorId: requestUserId,
        },
      },
      include: { fsrsData: true },
    });

    if (!flashcard) {
      throw new NotFoundException(
        'Flashcard não encontrado ou violação de Tenant.',
      );
    }

    const now = new Date();
    const nextDue = new Date();

    // 1. Captura de Snapshots Prévios (Before)
    // Se fsrsData for nulo, trata-se de um cartão virgem (estado inicial 0)
    const stabilityBefore = flashcard.fsrsData?.stability ?? 0;
    const difficultyBefore = flashcard.fsrsData?.difficulty ?? 0;

    // 2. Simulação de Cálculo FSRS (After) - MVP
    // Nota: Em produção, estas variáveis receberão o retorno da equação matemática do FSRS
    const stabilityAfter =
      rating >= ReviewRating.GOOD ? stabilityBefore + 1 : stabilityBefore;
    const difficultyAfter =
      rating === ReviewRating.AGAIN ? difficultyBefore + 1 : difficultyBefore;

    // 3. Regras de Intervalo Temporário (MVP)
    switch (rating) {
      case ReviewRating.AGAIN:
        nextDue.setMinutes(now.getMinutes() + 1);
        break;
      case ReviewRating.HARD:
        nextDue.setMinutes(now.getMinutes() + 10);
        break;
      case ReviewRating.GOOD:
        nextDue.setDate(now.getDate() + 1);
        break;
      case ReviewRating.EASY:
        nextDue.setDate(now.getDate() + 4);
        break;
    }

    const nextState =
      rating === ReviewRating.AGAIN ? CardState.RELEARNING : CardState.LEARNING;

    return this.prisma.$transaction(async (tx) => {
      // 4. Atualização do Motor FSRS com os novos valores (After)
      const updatedFsrsData = await tx.cardFSRSData.upsert({
        where: { flashcardId },
        create: {
          flashcardId,
          due: nextDue,
          stability: stabilityAfter,
          difficulty: difficultyAfter,
          reps: 1,
          state: CardState.LEARNING,
        },
        update: {
          due: nextDue,
          reps: { increment: 1 },
          state: nextState,
          stability: stabilityAfter,
          difficulty: difficultyAfter,
        },
      });

      // 5. Registro Imutável para o Dataset (Logs FSRS)
      await tx.reviewLog.create({
        data: {
          flashcardId,
          userId: requestUserId,
          rating,
          reviewDurationMs: 0,
          // Implementação das propriedades exigidas pelo Prisma Client
          stabilityBefore,
          difficultyBefore,
          stabilityAfter,
          difficultyAfter,
        },
      });

      return updatedFsrsData;
    });
  }
}
