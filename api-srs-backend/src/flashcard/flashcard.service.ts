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

    // CORREÇÃO: A variável 'cognitiveDelayOffset' foi deletada.
    // O módulo de Flashcard agora apenas cadastra o conteúdo no banco.

    return this.prisma.flashcard.create({
      data: {
        front: data.front,
        back: data.back,
        sourceContext: data.sourceContext,
        deckId: data.deckId,
        // Caso seu CreateFlashcardInput já contenha os campos multimídia:
        // imageUrl: data.imageUrl,
        // audioUrl: data.audioUrl,
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
        front: { not: '[DADO_ANONIMIZADO]' }, // Mantido: Conformidade estrita com LGPD
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }

  async updateFlashcard(userId: string, data: UpdateFlashcardInput) {
    const existingCard = await this.prisma.flashcard.findUnique({
      where: { id: data.id },
      include: { deck: true },
    });

    if (!existingCard || existingCard.deck.creatorId !== userId) {
      throw new ForbiddenException('Flashcard não encontrado ou acesso negado.');
    }

    return this.prisma.flashcard.update({
      where: { id: data.id },
      data: {
        front: data.front,
        back: data.back,
        sourceContext: data.sourceContext,
      },
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

    // Mantido: Fluxo de Anonimização Irreversível.
    return this.prisma.flashcard.update({
      where: { id },
      data: {
        front: '[DADO_ANONIMIZADO]',
        back: '[DADO_ANONIMIZADO]',
        sourceContext: null,
        imageUrl: null,
        audioUrl: null,
      },
    });
  }
}