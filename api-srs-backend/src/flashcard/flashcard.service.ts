import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Flashcard as PrismaFlashcard } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ANONYMIZED_PAYLOAD } from '../common/constants/domain.constants';
import { CreateFlashcardInput } from './dto/create-flashcard.input';
import { UpdateFlashcardInput } from './dto/update-flashcard.input';


@Injectable()
export class FlashcardService {
  constructor(private readonly prisma: PrismaService) { }

  async createFlashcard(userId: string, data: CreateFlashcardInput): Promise<PrismaFlashcard> {
    const deck = await this.prisma.deck.findUnique({
      where: { id: data.deckId },
      select: { creatorId: true, isArchived: true },
    });

    if (!deck) throw new NotFoundException('Deck não encontrado.');
    if (deck.creatorId !== userId || deck.isArchived) {
      throw new ForbiddenException('Acesso negado. Você não é o proprietário ou o baralho foi excluído.');
    }

    const { deckId, isEditedAfterAi, aiModelSource, ...cardData } = data;

    // 🟡 ALERTA CORRIGIDO: Remoção da injeção imediata de CardFSRSData. 
    // É mais limpo, mais rápido e deixa o "Lazy Initialization" funcionar de forma homogênea.
    return this.prisma.flashcard.create({
      data: {
        ...cardData,
        deckId: deckId,
        isEditedAfterAi: isEditedAfterAi ?? false,
        aiModelSource: aiModelSource ?? null,
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
        frontContent: { not: ANONYMIZED_PAYLOAD },
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

    if (existingCard.frontContent === ANONYMIZED_PAYLOAD) {
      throw new ForbiddenException('Não é possível modificar um flashcard anonimizado.');
    }

    // 🔵 SUGESTÃO APLICADA (DRY/OCP): Desestruturação
    const { id, ...updateData } = data;

    return this.prisma.flashcard.update({
      where: { id },
      data: updateData, // Todos os campos do DTO serão salvos de forma atômica
    });
  }

  /**
   * FLUXO DE ANONIMIZAÇÃO IRREVERSÍVEL (LGPD / GDPR)
   * Este método exemplifica por que a deleção do CardFSRSData é segura e necessária.
   */
  async anonymizeFlashcard(userId: string, id: string): Promise<PrismaFlashcard> {
    const flashcard = await this.prisma.flashcard.findUnique({
      where: { id },
      include: { deck: true },
    });

    if (!flashcard || flashcard.deck.creatorId !== userId || flashcard.deck.isArchived) {
      throw new NotFoundException('Flashcard não encontrado, acesso negado ou baralho já excluído.');
    }

    // Transação Atômica: Garante que ou tudo acontece, ou nada acontece (Rollback em caso de falha)
    return this.prisma.$transaction(async (tx) => {
      // 1. A DELEÇÃO SEGURA: Removemos a "Folha da Árvore".
      // Isso tira o cartão da fila de revisões futuras de TODOS os estudantes matriculados.
      // O banco de dados não quebra pois não existem Foreign Keys apontando PARA esta tabela.
      await tx.cardFSRSData.deleteMany({
        where: { flashcardId: id },
      });

      // 2. A ANONIMIZAÇÃO FÍSICA: O "Galho da Árvore" (Flashcard) continua existindo, 
      // mas seu conteúdo humano legível é permanentemente destruído.
      // Os "ReviewLogs" passados continuam apontando para este ID, preservando a matemática do ML.
      return tx.flashcard.update({
        where: { id },
        data: {
          frontContent: ANONYMIZED_PAYLOAD,
          backContent: ANONYMIZED_PAYLOAD,
          sourceContext: null,
          imageUrl: null,
          audioUrl: null,
        },
      });
    });
  }
}