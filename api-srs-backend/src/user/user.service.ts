import { Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sincroniza o usuário logado via Supabase com o banco de dados interno.
   * RF01 - Delegação de Identidade.
   */
  async syncUser(authId: string, email: string, name?: string): Promise<User> {
    this.logger.log(`Sincronizando identidade para o authId: ${authId}`);

    return this.prisma.user.upsert({
      where: { authId },
      update: {
        email, // Atualiza o e-mail caso tenha sido alterado no Supabase
        name,
      },
      create: {
        authId,
        email,
        name,
        totalXp: 0,
        currentStreak: 0,
        longestStreak: 0,
      },
    });
  }

  async findByAuthId(authId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { authId },
    });
  }
}
