import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateFlashcardInput,
  UpdateFlashcardInput,
} from './models/flashcard.model';

@Injectable()
export class FlashcardService {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly prisma: PrismaService) { }

  // 1. Assinatura corrigida para receber o userId do Resolver (Resolve TS2554)
  async createFlashcard(userId: string, data: CreateFlashcardInput) {
    // 1. Validação de Regra de Negócio: Garante a propriedade do Deck
    const deck = await this.prisma.deck.findUnique({
      where: { id: data.deckId },
      select: { creatorId: true },
    });

    if (!deck) {
      throw new NotFoundException('Deck não encontrado.');
    }

    if (deck.creatorId !== userId) {
      throw new ForbiddenException(
        'Acesso negado. Você não é o proprietário deste Deck.',
      );
    }

    // 2. Persistência do Flashcard com Inicialização FSRS Segura
    return this.prisma.flashcard.create({
      data: {
        front: data.front,
        back: data.back,
        deckId: data.deckId,
        fsrsData: {
          create: {
            stability: 0,
            difficulty: 0,
            state: 0, // NEW
            reps: 0,
            lapses: 0,
            // SOLUÇÃO: Omitimos a propriedade de data.
            // O TypeScript para de reclamar de propriedades desconhecidas e o
            // Prisma utilizará o @default(now()) do seu schema.prisma.
          },
        },
      },
      include: {
        fsrsData: true,
      },
    });
  }

  async getFlashcardsByDeck(userId: string, deckId: string) {
    const deck = await this.prisma.deck.findUnique({
      where: { id: deckId },
    });

    if (!deck || deck.creatorId !== userId) {
      throw new ForbiddenException('Acesso negado ao Deck.');
    }

    return this.prisma.flashcard.findMany({
      // O Filtro rigoroso: Ignora cartões anonimizados
      where: {
        deckId,
        front: { not: '[DADO_ANONIMIZADO]' },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateFlashcard(userId: string, data: UpdateFlashcardInput) {
    const { id, ...updateData } = data;

    const flashcard = await this.prisma.flashcard.findUnique({
      where: { id },
      include: { deck: true },
    });

    if (!flashcard || flashcard.deck.creatorId !== userId) {
      throw new NotFoundException('Flashcard não encontrado ou acesso negado.');
    }

    return this.prisma.flashcard.update({
      where: { id },
      data: updateData,
    });
  }

  async anonymizeFlashcard(userId: string, id: string) {
    const flashcard = await this.prisma.flashcard.findUnique({
      where: { id },
      include: { deck: true },
    });

    if (!flashcard || flashcard.deck.creatorId !== userId) {
      throw new NotFoundException('Flashcard não encontrado ou acesso negado.');
    }

    // Fluxo de Anonimização Irreversível garantindo a conformidade sem 'isArchived'
    return this.prisma.flashcard.update({
      where: { id },
      data: {
        front: '[DADO_ANONIMIZADO]',
        back: '[DADO_ANONIMIZADO]',
        sourceContext: null,
      },
    });
  }
}
