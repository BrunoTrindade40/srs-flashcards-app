import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ANONYMIZED_PAYLOAD, ENROLLMENT_STATUS } from '../common/constants/domain.constants';
import { CreateDeckInput } from './dto/create-deck.input';
import { UpdateDeckInput } from './dto/update-deck.input';

@Injectable()
export class DeckService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * CORREÇÃO CRÍTICA: Desacoplamento de Autoria e Matrícula.
   * A busca agora retorna os baralhos onde o usuário atua como ESTUDANTE (Enrollment ativo).
   */
  async findMyDecks(userId: string) {
    return this.prisma.deck.findMany({
      where: {
        isArchived: false,
        // Delegando a validação de pertencimento para a tabela associativa
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

  /**
   * 🛡️ ZERO TRUST E AUTORIZAÇÃO RELACIONAL
   * Resolve quem pode ler o baralho com uma única query (O Criador, o Estudante ou Público/Fase 2)
   */
  async findById(id: string, userId: string) {
    const deck = await this.prisma.deck.findFirst({
      where: { 
        id, 
        isArchived: false,
        OR: [
          { creatorId: userId },                                   // Autorização 1: É o criador do baralho
          { enrollments: { some: { userId, status: 'ACTIVE' } } }, // Autorização 2: É um estudante matriculado
          { isPublic: true }                                       // Autorização 3: É um baralho vitrine (Marketplace Fase 2)
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
        // Mantém a injeção atômica da matrícula ao criar (Auto-enrollment)
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

  async update(data: UpdateDeckInput, userId: string) {
    const deck = await this.findById(data.id, userId);
    
    if (deck.creatorId !== userId) {
      throw new ForbiddenException('Acesso Negado: Apenas o criador pode alterar o baralho.');
    }

    const { id, ...updateData } = data;
    const payload: Prisma.DeckUpdateInput = { ...updateData };

    // 🔴 CORREÇÃO CRÍTICA: Propagação do Arquivamento
    if (updateData.isArchived === true) {
      // 1. Apaga a fila FSRS (agenda) de todos os cartões que pertencem a este baralho
      await this.prisma.cardFSRSData.deleteMany({
        where: { flashcard: { deckId: id } },
      });

      // 2. Anonimiza os cartões físicos
      await this.prisma.flashcard.updateMany({
        where: { deckId: id },
        data: {
          frontContent: ANONYMIZED_PAYLOAD,
          backContent: ANONYMIZED_PAYLOAD,
          sourceContext: null,
          imageUrl: null,
          audioUrl: null,
          isPublished: false, // 🔵 SUGESTÃO APLICADA: Força a ocultação visual
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
        _count: { select: { flashcards: { where: { frontContent: { not: ANONYMIZED_PAYLOAD } } } } },
      },
    });
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const deck = await this.findById(id, userId);
    
    // 🛡️ ZERO TRUST
    if (deck.creatorId !== userId) {
      throw new ForbiddenException('Acesso Negado: Apenas o criador pode remover o baralho.');
    }

    await this.prisma.deck.delete({ where: { id } });
    return true;
  }

  async countFlashcards(deckId: string): Promise<number> {
    return this.prisma.flashcard.count({
      where: { deckId, frontContent: { not: ANONYMIZED_PAYLOAD } },
    });
  }

  /**
   * 🛡️ ZERO TRUST: Matrícula de Estudante (Consumo Desacoplado)
   * Permite que um usuário comece a estudar um baralho (Caminho para a Fase 2)
   */
  async enrollInDeck(deckId: string, userId: string): Promise<boolean> {
    const deck = await this.prisma.deck.findUnique({
      where: { id: deckId },
      select: { isArchived: true, isPublic: true, creatorId: true },
    });

    if (!deck || deck.isArchived) {
      throw new NotFoundException('Baralho não encontrado ou indisponível.');
    }

    // Regra de Negócio: Não pode se matricular em deck privado de outra pessoa
    if (!deck.isPublic && deck.creatorId !== userId) {
      throw new ForbiddenException('Este baralho é privado e pertence a outro autor.');
    }

    // Abordagem Atômica: Upsert garante que se a matrícula já existir (ex: PAUSED),
    // ela será reativada para ACTIVE, evitando duplicidade de registros.
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

  /**
   * 🔵 SUGESTÃO: Desmatrícula Segura
   * Evita a poluição da fila diária caso o aluno desista do deck.
   */
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