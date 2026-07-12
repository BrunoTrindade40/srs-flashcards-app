import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Flashcard as PrismaFlashcard } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StudyService {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Busca cartões devidos para revisão, aplicando o limite de Rollover (Efeito Bola de Neve).
   */
  async dueFlashcards(
    userId: string,
    deckId: string,
  ): Promise<PrismaFlashcard[]> {
    const deck = await this.prisma.deck.findUnique({
      where: { id: deckId },
      select: { creatorId: true },
    });

    if (!deck) throw new NotFoundException('Deck não encontrado.');
    if (deck.creatorId !== userId)
      throw new ForbiddenException('Acesso negado.');

    // 1. Busca os limites do estudante diretamente na tabela User
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dailyNewCardLimit: true, maxDailyReviews: true },
    });

    const dailyNewCardLimit = user?.dailyNewCardLimit ?? 20;
    const maxDailyReviews = user?.maxDailyReviews ?? 100;
    const now = new Date();

    // 2. Busca Cartões NOVOS (state: 0) com limite estrito
    const newCards = await this.prisma.flashcard.findMany({
      where: {
        deckId: deckId,
        front: { not: '[DADO_ANONIMIZADO]' },
        fsrsData: {
          due: { lte: now },
          state: 0, // 0 = Cartão Novo
        },
      },
      orderBy: { fsrsData: { due: 'asc' } },
      take: dailyNewCardLimit,
    });

    // 3. Busca Cartões de REVISÃO (state > 0) com limite estrito
    const reviewCards = await this.prisma.flashcard.findMany({
      where: {
        deckId: deckId,
        front: { not: '[DADO_ANONIMIZADO]' },
        fsrsData: {
          due: { lte: now },
          state: { gt: 0 }, // 1=LEARNING, 2=REVIEW, 3=RELEARNING
        },
      },
      orderBy: { fsrsData: { due: 'asc' } },
      take: maxDailyReviews,
    });

    // 4. Retorna primeiro as revisões atrasadas, depois os novos cartões
    return [...reviewCards, ...newCards];
  }

  /**
   * Registra a avaliação do usuário, recalcula o intervalo e grava a telemetria.
   */
  async submitReview(
    userId: string,
    flashcardId: string,
    rating: number,
  ): Promise<boolean> {
    const flashcard = await this.prisma.flashcard.findUnique({
      where: { id: flashcardId },
      include: { deck: true },
    });

    if (!flashcard || flashcard.deck.creatorId !== userId) {
      throw new ForbiddenException('Cartão não encontrado ou acesso negado.');
    }

    // Busca os dados FSRS atuais (Necessário para a telemetria do TCC 2)
    const fsrsData = await this.prisma.cardFSRSData.findUnique({
      where: { flashcardId },
    });

    if (!fsrsData) {
      throw new NotFoundException('Dados de agendamento não encontrados.');
    }

    // Lógica MVP de Agendamento (Base Simples para Evolução FSRS)
    // CORREÇÃO: Separação estrita de variáveis mutáveis (let) e imutáveis (const).
    // Isso satisfaz o verificador do TypeScript e as regras do ESLint.
    const { difficulty } = fsrsData;
    let { stability, reps, state } = fsrsData;
    const stabilityBefore = stability;
    const difficultyBefore = difficulty;

    if (rating === 1) {
      // Errou: reseta a estabilidade
      stability = 1;
      state = 3; // RELEARNING
    } else {
      // Acertou: expande o intervalo
      stability = stability === 0 ? 1 : stability * rating;
      state = 2; // REVIEW
    }

    reps += 1;

    const due = new Date();
    due.setDate(due.getDate() + stability);

    // TRANSAÇÃO ATÔMICA: Garante que os pesos e o Log sejam salvos simultaneamente.
    // Se o Log falhar, a atualização do Card também é revertida.
    await this.prisma.$transaction([
      this.prisma.cardFSRSData.update({
        where: { flashcardId },
        data: { stability, difficulty, reps, state, due },
      }),
      this.prisma.reviewLog.create({
        data: {
          flashcardId,
          userId,
          rating,
          reviewDurationMs: 0, // MVP: O frontend enviará o timing exato no futuro
          stabilityBefore,
          difficultyBefore,
          stabilityAfter: stability,
          difficultyAfter: difficulty,
        },
      }),
    ]);

    return true;
  }
}
