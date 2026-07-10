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
   * Busca cartões devidos para revisão hoje, ignorando os excluídos (anonimizados).
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

    const now = new Date();

    return this.prisma.flashcard.findMany({
      where: {
        deckId: deckId,
        // CORREÇÃO: Ignora ativamente os cartões excluídos no Frontend
        front: { not: '[DADO_ANONIMIZADO]' },
        // A data 'due' deve ser menor ou igual a hoje
        fsrsData: {
          due: { lte: now },
        },
      },
      orderBy: {
        fsrsData: { due: 'asc' },
      },
    });
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
