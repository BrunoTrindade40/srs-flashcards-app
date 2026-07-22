import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { User as PrismaUser } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserSettingsInput } from './models/user.model';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  // eslint-disable-next-line prettier/prettier
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sincroniza o usuário logado via Supabase com o banco de dados interno.
   * RF01 - Delegação de Identidade.
   */
  async syncUser(
    authId: string,
    email: string,
    name?: string,
  ): Promise<PrismaUser> {
    this.logger.log(`Sincronizando identidade para o authId: ${authId}`);

    return this.prisma.user.upsert({
      where: { authId },
      update: {
        email,
        name,
      },
      create: {
        authId,
        email,
        name,
        totalXp: 0,
        currentStreak: 0,
        longestStreak: 0,
        // Limites diários usam os valores default (definidos no schema.prisma)
      },
    });
  }

  async findByAuthId(authId: string): Promise<PrismaUser | null> {
    return this.prisma.user.findUnique({
      where: { authId },
    });
  }

  async findById(id: string): Promise<PrismaUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  // Novo método para atualização (RF07) - Altera diretamente na tabela User
  async updateSettings(
    userId: string,
    data: UpdateUserSettingsInput,
  ): Promise<PrismaUser> {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }
}
