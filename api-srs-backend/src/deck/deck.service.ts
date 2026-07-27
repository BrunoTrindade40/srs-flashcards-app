import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ANONYMIZED_PAYLOAD } from '../common/constants/domain.constants';
import { CreateDeckInput } from './dto/create-deck.input';
import { UpdateDeckInput } from './dto/update-deck.input';

@Injectable()
export class DeckService {
  constructor(private readonly prisma: PrismaService) { }

  async findMyDecks(userId: string) {
    return this.prisma.deck.findMany({
      where: { creatorId: userId, isArchived: false },
      include: {
        _count: {
          select: {
            flashcards: { where: { front: { not: ANONYMIZED_PAYLOAD } } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: string, userId: string) {
    const deck = await this.prisma.deck.findFirst({
      where: { id, creatorId: userId, isArchived: false },
      include: {
        flashcards: {
          where: { front: { not: ANONYMIZED_PAYLOAD } },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            flashcards: { where: { front: { not: ANONYMIZED_PAYLOAD } } },
          },
        },
      },
    });

    if (!deck) {
      throw new NotFoundException('Baralho não encontrado.');
    }
    return deck;
  }

  async create(data: CreateDeckInput, userId: string) {
    return this.prisma.deck.create({
      data: {
        ...data,
        creatorId: userId,
      },
      include: {
        _count: {
          select: {
            flashcards: { where: { front: { not: ANONYMIZED_PAYLOAD } } },
          },
        },
      },
    });
  }

  async update(data: UpdateDeckInput, userId: string) {
    await this.findById(data.id, userId);

    const { id, ...updateData } = data;

    // 🔴 CRÍTICO CORRIGIDO: Conversão segura de DTO para Prisma Payload
    // O tipo Prisma.DeckUpdateInput entende nativamente que campos vazios do BD recebem 'null'
    const payload: Prisma.DeckUpdateInput = { ...updateData };

    if (updateData.isArchived === true) {
      await this.prisma.flashcard.updateMany({
        where: { deckId: id },
        data: {
          front: ANONYMIZED_PAYLOAD,
          back: ANONYMIZED_PAYLOAD,
          sourceContext: null,
          imageUrl: null,
          audioUrl: null,
        },
      });

      payload.title = ANONYMIZED_PAYLOAD;
      payload.description = null;
      payload.sourceLanguage = null;
      payload.targetLanguage = null;
    }

    return this.prisma.deck.update({
      where: { id },
      data: payload,
      include: {
        _count: {
          select: {
            flashcards: { where: { front: { not: ANONYMIZED_PAYLOAD } } },
          },
        },
      },
    });
  }

  async remove(id: string, userId: string): Promise<boolean> {
    await this.findById(id, userId);
    await this.prisma.deck.delete({
      where: { id },
    });
    return true;
  }

  async countFlashcards(deckId: string): Promise<number> {
    return this.prisma.flashcard.count({
      where: { deckId, front: { not: ANONYMIZED_PAYLOAD } },
    });
  }
}