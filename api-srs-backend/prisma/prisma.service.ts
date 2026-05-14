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
    const connectionString = process.env.DIRECT_URL;

    if (!connectionString) {
      throw new Error(
        'A variável de ambiente DIRECT_URL não está definida no .env',
      );
    }

    // O max: 10 define o limite do Pool interno do Node.js
    const pool = new Pool({ connectionString, max: 10 });
    const adapter = new PrismaPg(pool);

    // Em versões >= 7.0, a passagem do adaptador instanciado é obrigatória
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log(
      'Conexão com o banco de dados PostgreSQL (Supabase) estabelecida via pg-adapter.',
    );
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Conexão com o banco de dados encerrada.');
  }
}
