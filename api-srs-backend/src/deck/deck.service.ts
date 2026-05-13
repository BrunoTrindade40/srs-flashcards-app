import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeckInput, UpdateDeckInput } from './models/deck.model';

@Injectable()
export class DeckService {
  constructor(private readonly prisma: PrismaService) {}

  async createDeck(userId: string, data: CreateDeckInput) {
    return this.prisma.deck.create({
      data: {
        ...data,
        creator: {
          connect: { id: userId },
        },
      },
    });
  }

  async getUserDecks(userId: string) {
    return this.prisma.deck.findMany({
      where: { creatorId: userId, isArchived: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDeckById(userId: string, deckId: string) {
    const deck = await this.prisma.deck.findFirst({
      where: { id: deckId, creatorId: userId },
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
