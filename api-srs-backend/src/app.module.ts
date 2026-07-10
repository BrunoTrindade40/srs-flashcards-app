import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { Request } from 'express';
import { join } from 'path';
import { PrismaModule } from '../prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DeckModule } from './deck/deck.module';
import { FlashcardModule } from './flashcard/flashcard.module';
import { StudyModule } from './study/study.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    // Carrega o .env e torna as variáveis globais antes de tudo
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Garante que lê o arquivo na raiz
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true,
      // Esta linha é crucial: mapeia a requisição HTTP para o contexto do GraphQL
      context: ({ req }: { req: Request }) => ({ req }),
    }),
    PrismaModule,
    UserModule,
    DeckModule,
    FlashcardModule,
    StudyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
// eslint-disable-next-line prettier/prettier
export class AppModule { }
