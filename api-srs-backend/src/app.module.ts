import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
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
      // CORREÇÃO: Desliga o Playground legado e injeta o Apollo Sandbox
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
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
export class AppModule { }
