/* eslint-disable prettier/prettier */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly configService: ConfigService) {
    // 1. Captura dinâmica da URL de conexão em tempo de execução
    const connectionString =
      configService.get<string>('DIRECT_URL') ||
      configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error(
        'Falha Crítica de Infraestrutura: DIRECT_URL ausente no ambiente de execução.',
      );
    }

    // 2. Inicialização do Pool nativo do Node-Postgres
    // CORREÇÃO: Força explicitamente o node-postgres a negociar uma conexão TLS/SSL.
    // Sem o objeto 'ssl' configurado, o Supabase encerra o socket de forma abrupta.
    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Permite a criptografia sem exigir o bundle do certificado local
      },
    });

    // 3. Acoplamento do Adaptador PG ao motor do Prisma
    const adapter = new PrismaPg(pool);

    // 4. Delegação da infraestrutura de rede para a classe pai
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
