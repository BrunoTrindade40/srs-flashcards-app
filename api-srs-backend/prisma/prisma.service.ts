/* eslint-disable prettier/prettier */
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'A variável de ambiente DATABASE_URL não está definida no .env',
      );
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log(
      'Conexão com o banco de dados PostgreSQL (Supabase) estabelecida.',
    );
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Conexão com o banco de dados encerrada.');
  }
}
