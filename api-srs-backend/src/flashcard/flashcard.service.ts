import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Flashcard as PrismaFlashcard } from '@prisma/client';
// Importação corrigida: createEmptyCard e Card são importados diretamente
import { Card, createEmptyCard } from 'ts-fsrs';
import { PrismaService } from '../../prisma/prisma.service';
// 🟡 CORREÇÃO ALERTA: Importação da fonte de verdade da constante de negócio
import { ANONYMIZED_PAYLOAD } from '../common/constants/domain.constants';
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
    const emptyCard: Card = createEmptyCard();

    const deck = await this.prisma.deck.findUnique({
      where: { id: data.deckId },
      // 🔴 CORREÇÃO CRÍTICA: Traciona a verificação de exclusão lógica do pai
      select: { creatorId: true, isArchived: true },
    });

    if (!deck) {
      throw new NotFoundException('Deck não encontrado.');
    }

    // Bloqueia a injeção caso o baralho esteja arquivado
    if (deck.creatorId !== userId || deck.isArchived) {
      throw new ForbiddenException(
        'Acesso negado. Você não é o proprietário ou o baralho foi excluído.',
      );
    }

    // 3. Persistência Atômica via Nested Writes
    return this.prisma.flashcard.create({
      data: {
        front: data.front,
        back: data.back,
        sourceContext: data.sourceContext,
        deckId: data.deckId,
        // Encadeamento obrigatório do metadado de aprendizado inicial
        fsrsData: {
          create: {
            userId: userId,
            stability: emptyCard.stability,
            difficulty: emptyCard.difficulty,
            // 🔴 CORREÇÃO CRÍTICA: Restauração do mapeamento em snake_case.
            // O aviso visual de depreciação gerado pelo TypeScript deve ser ignorado.
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
        // Aplicação no filtro de leitura
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

    // 🔴 CORREÇÃO CRÍTICA: Impede atualização de cartão de um baralho excluído
    if (!existingCard || existingCard.deck.creatorId !== userId || existingCard.deck.isArchived) {
      throw new ForbiddenException('Flashcard não encontrado, acesso negado ou baralho excluído.');
    }

    // 🔴 CORREÇÃO CRÍTICA: Bloqueia a adulteração de registros logicamente excluídos
    if (existingCard.front === ANONYMIZED_PAYLOAD) {
      throw new ForbiddenException('Não é possível modificar um flashcard anonimizado.');
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

    // 🔴 CORREÇÃO CRÍTICA: Impede re-anonimização inútil caso o baralho já esteja morto
    if (!flashcard || flashcard.deck.creatorId !== userId || flashcard.deck.isArchived) {
      throw new NotFoundException('Flashcard não encontrado, acesso negado ou baralho já excluído.');
    }

    return this.prisma.flashcard.update({
      where: { id },
      data: {
        // Aplicação na mutação de dados para anonimização LGPD
        front: ANONYMIZED_PAYLOAD,
        back: ANONYMIZED_PAYLOAD,
        sourceContext: null,
        imageUrl: null,
        audioUrl: null,
      },
    });
  }
}