import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeckInput, UpdateDeckInput } from './models/deck.model';

import { Deck as PrismaDeck } from '@prisma/client';

export type DeckWithCount = PrismaDeck & {
  _count: {
    flashcards: number;
  };
};

@Injectable()
export class DeckService {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly prisma: PrismaService) { }

  async createDeck(userId: string, data: CreateDeckInput): Promise<PrismaDeck> {
    return this.prisma.deck.create({
      data: {
        ...data,
        creatorId: userId,
      },
    });
  }

  async getUserDecks(userId: string): Promise<DeckWithCount[]> {
    return this.prisma.deck.findMany({
      where: { creatorId: userId, isArchived: false },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            flashcards: {
              // CORREÇÃO: O Prisma agora ignora os cartões anonimizados na contagem
              where: {
                front: { not: '[DADO_ANONIMIZADO]' },
              },
            },
          },
        },
      },
    });
  }

  async getDeckById(userId: string, deckId: string): Promise<DeckWithCount> {
    const deck = await this.prisma.deck.findFirst({
      where: { id: deckId, creatorId: userId },
      include: {
        _count: {
          select: {
            flashcards: {
              // CORREÇÃO: O Prisma agora ignora os cartões anonimizados na contagem
              where: {
                front: { not: '[DADO_ANONIMIZADO]' },
              },
            },
          },
        },
      },
    });

    if (!deck) {
      throw new NotFoundException('Deck não encontrado ou acesso negado.');
    }

    return deck;
  }

  async updateDeck(userId: string, data: UpdateDeckInput): Promise<PrismaDeck> {
    const { id, ...updateData } = data;
    await this.getDeckById(userId, id);

    return this.prisma.deck.update({
      where: { id },
      data: updateData,
    });
  }

  async archiveDeck(userId: string, deckId: string): Promise<PrismaDeck> {
    await this.getDeckById(userId, deckId);

    return this.prisma.deck.update({
      where: { id: deckId },
      data: { isArchived: true },
    });
  }
}
