import { Injectable, NotFoundException } from '@nestjs/common';
import { Deck } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ANONYMIZED_PAYLOAD } from '../common/constants/domain.constants';
import { CreateDeckInput } from './dto/create-deck.input';
import { UpdateDeckInput } from './dto/update-deck.input';

@Injectable()
export class DeckService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createDeckInput: CreateDeckInput, creatorId: string): Promise<Deck> {
    return this.prisma.deck.create({
      data: { ...createDeckInput, creatorId },
      include: {
        _count: {
          select: { flashcards: true }, // Em novos baralhos, a contagem sempre nasce zerada
        },
      },
    });
  }

  async findAllByUser(creatorId: string): Promise<Deck[]> {
    return this.prisma.deck.findMany({
      where: { creatorId, isArchived: false },
      include: {
        _count: {
          select: {
            // 🔴 CORREÇÃO CRÍTICA: O banco conta apenas cartões que não foram excluídos (anonimizados)
            flashcards: {
              where: { front: { not: ANONYMIZED_PAYLOAD } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, creatorId: string): Promise<Deck> {
    const deck = await this.prisma.deck.findFirst({
      // 🔴 CORREÇÃO CRÍTICA: Bloqueia acesso a baralhos logicamente excluídos
      where: { id, creatorId, isArchived: false },
      include: {
        _count: {
          select: {
            flashcards: {
              where: { front: { not: ANONYMIZED_PAYLOAD } },
            },
          },
        },
      },
    });

    if (!deck) {
      throw new NotFoundException('O baralho solicitado não foi encontrado ou já foi excluído.');
    }

    return deck;
  }

  async update(updateDeckInput: UpdateDeckInput, creatorId: string): Promise<Deck> {
    const { id, ...fieldsToUpdate } = updateDeckInput;
    await this.findOne(id, creatorId);

    return this.prisma.deck.update({
      where: { id },
      data: fieldsToUpdate,
      include: {
        _count: {
          select: {
            flashcards: {
              where: { front: { not: ANONYMIZED_PAYLOAD } },
            },
          },
        },
      },
    });
  }

  async remove(id: string, creatorId: string): Promise<boolean> {
    await this.findOne(id, creatorId);

    // 🔴 CORREÇÃO CRÍTICA: Proteção contra CASCADE delete para manter os ReviewLogs (ML).
    // O baralho é arquivado e seus cartões sofrem a anonimização irreversível.
    await this.prisma.$transaction([
      this.prisma.deck.update({
        where: { id },
        data: { isArchived: true },
      }),
      this.prisma.flashcard.updateMany({
        where: { deckId: id },
        data: {
          front: ANONYMIZED_PAYLOAD,
          back: ANONYMIZED_PAYLOAD,
          sourceContext: null,
          imageUrl: null,
          audioUrl: null,
        },
      }),
    ]);

    return true;
  }
}