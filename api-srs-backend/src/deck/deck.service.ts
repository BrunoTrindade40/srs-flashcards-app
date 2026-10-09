import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ANONYMIZED_PAYLOAD, ENROLLMENT_STATUS } from '../common/constants/domain.constants';
import { CreateDeckInput } from './dto/create-deck.input';
import { UpdateDeckInput } from './dto/update-deck.input';

@Injectable()
export class DeckService {
  constructor(private readonly prisma: PrismaService) { }

  async findMyDecks(userId: string) {
    return this.prisma.deck.findMany({
      where: {
        isArchived: false,
        enrollments: {
          some: {
            userId: userId,
            status: 'ACTIVE',
          },
        },
      },
      include: {
        _count: {
          select: {
            flashcards: { where: { frontContent: { not: ANONYMIZED_PAYLOAD } } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: string, userId: string) {
    const deck = await this.prisma.deck.findFirst({
      where: { 
         id,
         isArchived: false,
        OR: [
          { creatorId: userId },                                   
          { enrollments: { some: { userId, status: 'ACTIVE' } } }, 
          { isPublic: true }                                       
        ]
      },
      include: {
        flashcards: {
          where: { frontContent: { not: ANONYMIZED_PAYLOAD } },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { flashcards: { where: { frontContent: { not: ANONYMIZED_PAYLOAD } } } },
        },
      },
    });

    if (!deck) {
      throw new NotFoundException('Baralho não encontrado, privado ou acesso negado.');
    }
    return deck;
  }

  async create(data: CreateDeckInput, userId: string) {
    return this.prisma.deck.create({
      data: {
        ...data,
        creatorId: userId,
        enrollments: {
          create: {
            userId,
            status: 'ACTIVE',
          },
        },
      },
      include: {
        _count: {
          select: {
            flashcards: { where: { frontContent: { not: ANONYMIZED_PAYLOAD } } },
          },
        },
      },
    });
  }

  /**
   * Refatorado: Remove a lógica destrutiva de anonimização.
   * Apenas executa atualizações léxicas e de metadados simples (SRP).
   */
  async update(data: UpdateDeckInput, userId: string) {
    const deck = await this.findById(data.id, userId);
         
    if (deck.creatorId !== userId) {
      throw new ForbiddenException('Acesso Negado: Apenas o criador pode alterar o baralho.');
    }

    const { id, ...updateData } = data;
    const payload: Prisma.DeckUpdateInput = { ...updateData };

    return this.prisma.deck.update({
      where: { id },
      data: payload,
      include: {
        _count: { select: { flashcards: { where: { frontContent: { not: ANONYMIZED_PAYLOAD } } } } },
      },
    });
  }

  /**
   * NOVO: Método dedicado exclusivamente para a inversão do estado lógico de Arquivamento.
   * Não afeta o conteúdo dos Flashcards ou a telemetria do FSRS.
   */
  async toggleArchive(deckId: string, userId: string) {
    // Zero Trust: Ignora o 'isArchived' false no findFirst para encontrar mesmo os arquivados
    const deck = await this.prisma.deck.findFirst({
        where: { id: deckId, creatorId: userId }
    });

    if (!deck) {
      throw new ForbiddenException('Baralho não encontrado ou você não possui direitos de autor para arquivá-lo.');
    }

    return this.prisma.deck.update({
      where: { id: deckId },
      data: { isArchived: !deck.isArchived },
      include: {
        _count: { select: { flashcards: { where: { frontContent: { not: ANONYMIZED_PAYLOAD } } } } },
      },
    });
  }

  async remove(id: string, userId: string): Promise<boolean> {
    // Usamos findFirst direto para contornar o bloqueio de "isArchived: false" no findById
    const deck = await this.prisma.deck.findFirst({
        where: { id, creatorId: userId }
    });
         
    if (!deck) {
      throw new ForbiddenException('Acesso Negado: Baralho inexistente ou permissão insuficiente.');
    }

    await this.prisma.deck.delete({ where: { id } });
    return true;
  }

  async countFlashcards(deckId: string): Promise<number> {
    return this.prisma.flashcard.count({
      where: { deckId, frontContent: { not: ANONYMIZED_PAYLOAD } },
    });
  }

  async enrollInDeck(deckId: string, userId: string): Promise<boolean> {
    const deck = await this.prisma.deck.findUnique({
      where: { id: deckId },
      select: { isArchived: true, isPublic: true, creatorId: true },
    });

    if (!deck || deck.isArchived) {
      throw new NotFoundException('Baralho não encontrado ou indisponível.');
    }

    if (!deck.isPublic && deck.creatorId !== userId) {
      throw new ForbiddenException('Este baralho é privado e pertence a outro autor.');
    }

    await this.prisma.enrollment.upsert({
      where: {
        userId_deckId: { userId, deckId },
      },
      update: {
        status: 'ACTIVE',
      },
      create: {
        userId,
        deckId,
        status: 'ACTIVE',
      },
    });

    return true;
  }

  async unenrollFromDeck(deckId: string, userId: string): Promise<boolean> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_deckId: { userId, deckId } }
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada.');
    }

    await this.prisma.enrollment.update({
      where: { userId_deckId: { userId, deckId } },
      data: { status: ENROLLMENT_STATUS.DROPPED },
    });

    return true;
  }
}