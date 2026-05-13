import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    // 1. Carrega o .env globalmente ANTES de qualquer outro módulo
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Garante que o arquivo na raiz será lido
    }),

    // 2. Inicializa o GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
    }),

    // 3. Módulos de Domínio
    PrismaModule,
    UserModule,
  ],
})
export class AppModule { }
