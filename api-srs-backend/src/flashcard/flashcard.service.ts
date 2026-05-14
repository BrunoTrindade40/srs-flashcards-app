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
  constructor(private readonly prisma: PrismaService) {}

  async createFlashcard(userId: string, data: CreateFlashcardInput) {
    const deck = await this.prisma.deck.findUnique({
      where: { id: data.deckId },
    });

    if (!deck || deck.creatorId !== userId) {
      throw new ForbiddenException(
        'Acesso negado: O Deck especificado não pertence a este usuário.',
      );
    }

    return this.prisma.flashcard.create({ data });
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
