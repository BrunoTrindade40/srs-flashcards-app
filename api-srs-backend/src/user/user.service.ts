import { Injectable, NotFoundException } from '@nestjs/common';
import { User as PrismaUser } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserSettingsInput } from './models/user.model';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Abordagem KISS & Atômica: Upsert Silencioso.
   * Evita "Race Conditions" (condições de corrida) em requisições paralelas.
   */
  async upsertUserByAuthId(authId: string, email: string, name: string): Promise<PrismaUser> {
    return this.prisma.user.upsert({
      where: { authId },
      update: { email, name }, // Mantém dados sincronizados com o Supabase
      create: {
        authId,
        email,
        name,
        // timezone, maxDailyReviews, etc., assumem o @default() do schema.prisma
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