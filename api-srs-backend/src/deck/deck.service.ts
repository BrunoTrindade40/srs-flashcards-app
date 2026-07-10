import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeckInput, UpdateDeckInput } from './models/deck.model';

// 1. Importamos o tipo gerado automaticamente pelo Prisma
import { Deck as PrismaDeck } from '@prisma/client';

// 2. Criamos uma interface tipada (Zero 'any') que une o Deck do Prisma com o _count gerado pelo JOIN
export type DeckWithCount = PrismaDeck & {
  _count: {
    flashcards: number;
  };
};

@Injectable()
export class DeckService {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly prisma: PrismaService) { }

  async createDeck(userId: string, data: CreateDeckInput) {
    return this.prisma.deck.create({
      data: {
        ...data,
        creatorId: userId,
      },
    });
  }

  async getUserDecks(userId: string) {
    return this.prisma.deck.findMany({
      where: { creatorId: userId, isArchived: false },
      orderBy: { createdAt: 'desc' },
      // 1. Instruímos o Prisma a agregar a contagem de Flashcards para cada Deck
      include: {
        _count: {
          select: { flashcards: true },
        },
      },
    });
  }

  async getDeckById(userId: string, deckId: string) {
    const deck = await this.prisma.deck.findFirst({
      where: { id: deckId, creatorId: userId },
      // 2. Incluímos a mesma lógica ao procurar um Deck específico
      include: {
        _count: {
          select: { flashcards: true },
        },
      },
    });

    if (!deck) {
      throw new NotFoundException('Deck não encontrado ou acesso negado.');
    }

    return deck;
  }

  async updateDeck(userId: string, data: UpdateDeckInput) {
    const { id, ...updateData } = data;

    // Valida a existência e a posse do Deck antes de atualizar
    await this.getDeckById(userId, id);

    return this.prisma.deck.update({
      where: { id },
      data: updateData,
    });
  }

  async archiveDeck(userId: string, deckId: string) {
    await this.getDeckById(userId, deckId);

    return this.prisma.deck.update({
      where: { id: deckId },
      data: { isArchived: true },
    });
  }
}
