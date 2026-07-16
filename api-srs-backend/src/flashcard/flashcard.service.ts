import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Flashcard as PrismaFlashcard } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateFlashcardInput,
  UpdateFlashcardInput,
} from './models/flashcard.model';

@Injectable()
export class FlashcardService {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly prisma: PrismaService) { }

  async createFlashcard(
    userId: string,
    data: CreateFlashcardInput,
  ): Promise<PrismaFlashcard> {
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

    return this.prisma.flashcard.create({
      data: {
        front: data.front,
        back: data.back,
        sourceContext: data.sourceContext,
        deckId: data.deckId,
        fsrsData: {
          create: {
            stability: 0,
            difficulty: 0,
            state: 0, // NEW
            reps: 0,
            lapses: 0,
          },
        },
      },
      include: {
        fsrsData: true,
      },
    });
  }

  async getFlashcardsByDeck(
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

    return this.prisma.flashcard.findMany({
      where: {
        deckId,
        front: { not: '[DADO_ANONIMIZADO]' },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000, // Limite de segurança para evitar estrangulamento de memória (OOM)
    });
  }

  async updateFlashcard(
    userId: string,
    data: UpdateFlashcardInput,
  ): Promise<PrismaFlashcard> {
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

  async anonymizeFlashcard(
    userId: string,
    id: string,
  ): Promise<PrismaFlashcard> {
    const flashcard = await this.prisma.flashcard.findUnique({
      where: { id },
      include: { deck: true },
    });

    if (!flashcard || flashcard.deck.creatorId !== userId) {
      throw new NotFoundException('Flashcard não encontrado ou acesso negado.');
    }

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
