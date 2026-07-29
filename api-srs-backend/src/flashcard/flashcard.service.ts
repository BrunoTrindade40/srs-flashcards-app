import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Flashcard as PrismaFlashcard } from '@prisma/client';
import { Card, createEmptyCard } from 'ts-fsrs';
import { PrismaService } from '../../prisma/prisma.service';
import { ANONYMIZED_PAYLOAD } from '../common/constants/domain.constants';
import { CreateFlashcardInput } from './dto/create-flashcard.input';
import { UpdateFlashcardInput } from './dto/update-flashcard.input';


@Injectable()
export class FlashcardService {
  constructor(private readonly prisma: PrismaService) { }

  async createFlashcard(
    userId: string,
    data: CreateFlashcardInput,
  ): Promise<PrismaFlashcard> {
    const emptyCard: Card = createEmptyCard();

    const deck = await this.prisma.deck.findUnique({
      where: { id: data.deckId },
      select: { creatorId: true, isArchived: true },
    });

    if (!deck) {
      throw new NotFoundException('Deck não encontrado.');
    }

    if (deck.creatorId !== userId || deck.isArchived) {
      throw new ForbiddenException(
        'Acesso negado. Você não é o proprietário ou o baralho foi excluído.',
      );
    }

    // 🔵 SUGESTÃO APLICADA (Boy Scout): Desestruturação para mapeamento automático
    const { deckId, ...cardData } = data;

    return this.prisma.flashcard.create({
      data: {
        ...cardData, // Injeta front, back, sourceContext, imageUrl e audioUrl nativamente
        deckId: deckId,
        fsrsData: {
          create: {
            userId: userId,
            stability: emptyCard.stability,
            difficulty: emptyCard.difficulty,
            elapsedDays: emptyCard.elapsed_days,
            scheduledDays: emptyCard.scheduled_days,
            reps: emptyCard.reps,
            lapses: emptyCard.lapses,
            state: emptyCard.state,
            due: emptyCard.due,
            lastReview: emptyCard.last_review || null,
          },
        },
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
        front: { not: ANONYMIZED_PAYLOAD },
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

    if (!existingCard || existingCard.deck.creatorId !== userId || existingCard.deck.isArchived) {
      throw new ForbiddenException('Flashcard não encontrado, acesso negado ou baralho excluído.');
    }

    if (existingCard.front === ANONYMIZED_PAYLOAD) {
      throw new ForbiddenException('Não é possível modificar um flashcard anonimizado.');
    }

    // 🔵 SUGESTÃO APLICADA (DRY/OCP): Desestruturação
    const { id, ...updateData } = data;

    return this.prisma.flashcard.update({
      where: { id },
      data: updateData, // Todos os campos do DTO serão salvos de forma atômica
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

    if (!flashcard || flashcard.deck.creatorId !== userId || flashcard.deck.isArchived) {
      throw new NotFoundException('Flashcard não encontrado, acesso negado ou baralho já excluído.');
    }

    return this.prisma.flashcard.update({
      where: { id },
      data: {
        front: ANONYMIZED_PAYLOAD,
        back: ANONYMIZED_PAYLOAD,
        sourceContext: null,
        imageUrl: null,
        audioUrl: null,
      },
    });
  }
}