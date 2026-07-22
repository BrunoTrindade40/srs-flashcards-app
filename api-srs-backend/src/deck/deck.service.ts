import { Injectable, NotFoundException } from '@nestjs/common';
import { Deck } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeckInput } from './dto/create-deck.input';
import { UpdateDeckInput } from './dto/update-deck.input';

@Injectable()
export class DeckService {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly prisma: PrismaService) {}

  // Cria o baralho e retorna a projeção de dados incluindo contagem zerada
  async create(
    createDeckInput: CreateDeckInput,
    creatorId: string,
  ): Promise<Deck> {
    return this.prisma.deck.create({
      data: {
        ...createDeckInput,
        creatorId,
      },
      include: {
        _count: {
          select: {
            flashcards: true,
          },
        },
      },
    });
  }

  // Lista todos os baralhos injetando nativamente a contagem de flashcards
  async findAllByUser(creatorId: string): Promise<Deck[]> {
    return this.prisma.deck.findMany({
      where: {
        creatorId,
        isArchived: false,
      },
      include: {
        _count: {
          select: {
            flashcards: true, // Prisma executa o COUNT de flashcards diretamente no SQL
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Busca unitária filtrando por posse e incluindo metadados relacionais
  async findOne(id: string, creatorId: string): Promise<Deck> {
    const deck = await this.prisma.deck.findFirst({
      where: {
        id,
        creatorId,
      },
      include: {
        _count: {
          select: {
            flashcards: true,
          },
        },
      },
    });

    if (!deck) {
      throw new NotFoundException(
        'O baralho solicitado não foi encontrado ou você não tem permissão para acessá-lo.',
      );
    }

    return deck;
  }

  // Atualiza os dados e retorna o objeto atualizado contendo o contador
  async update(
    updateDeckInput: UpdateDeckInput,
    creatorId: string,
  ): Promise<Deck> {
    const { id, ...fieldsToUpdate } = updateDeckInput;

    // Validação preventiva de propriedade antes da persistência
    await this.findOne(id, creatorId);

    return this.prisma.deck.update({
      where: { id },
      data: fieldsToUpdate,
      include: {
        _count: {
          select: {
            flashcards: true,
          },
        },
      },
    });
  }

  // Exclusão física do baralho (comportamento CASCADE do Postgres apagará os flashcards)
  async remove(id: string, creatorId: string): Promise<boolean> {
    await this.findOne(id, creatorId);

    await this.prisma.deck.delete({
      where: { id },
    });

    return true;
  }
}
