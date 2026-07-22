import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Flashcard as PrismaFlashcard } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { Flashcard } from '../flashcard/models/flashcard.model';
import { StudyService } from './study.service';

// Interface estrita para o payload do usuário autenticado via Supabase Auth
export interface AuthUserPayload {
  id: string;
  email?: string;
  authId?: string;
}

@Resolver(() => Flashcard)
@UseGuards(GqlAuthGuard)
export class StudyResolver {
  constructor(private readonly studyService: StudyService) { }

  /**
   * RF04: Query GraphQL para buscar a Fila Diária de Estudos (Bypass + Revisão + Novos)
   * Retorna uma lista de cartões combinados e embaralhados de forma randômica.
   */
  @Query(() => [Flashcard], { name: 'dueFlashcards' })
  async getDueFlashcards(
    @CurrentUser() user: AuthUserPayload,
    @Args('deckId', { type: () => ID }) deckId: string,
  ): Promise<PrismaFlashcard[]> {
    // Repassa o ID do usuário injetado pelo Supabase e o ID do Deck desejado
    return this.studyService.dueFlashcards(user.id, deckId);
  }

  /**
   * RF05: Mutation GraphQL para submeter a avaliação de retenção da pílula de estudo
   * Coleta a nota (1-4) e a latência de resposta para alimentar a telemetria do TCC 2.
   */
  @Mutation(() => Boolean, { name: 'submitReview' })
  async submitReview(
    @CurrentUser() user: AuthUserPayload,
    @Args('flashcardId', { type: () => ID }) flashcardId: string,
    @Args('rating', { type: () => Int }) rating: number,
    @Args('reviewDurationMs', { type: () => Int, defaultValue: 0 })
    reviewDurationMs: number,
  ): Promise<boolean> {
    // Executa a transação atômica do FSRS no banco e retorna verdadeiro/falso
    return this.studyService.submitReview(
      user.id,
      flashcardId,
      rating,
      reviewDurationMs,
    );
  }
}