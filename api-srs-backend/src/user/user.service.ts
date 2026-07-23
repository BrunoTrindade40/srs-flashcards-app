import { Injectable, NotFoundException } from '@nestjs/common';
import { User as PrismaUser } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserSettingsInput } from './models/user.model';

@Injectable()
export class UserService {
  // CORREÇÃO: O Logger foi removido, pois sua única dependência (syncUser) foi deletada.
  constructor(private readonly prisma: PrismaService) { }

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