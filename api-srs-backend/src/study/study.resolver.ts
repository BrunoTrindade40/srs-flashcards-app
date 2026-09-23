import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { Flashcard } from '../flashcard/models/flashcard.model';
import { User } from '../user/models/user.model';
import { ReviewResult } from './models/review-result.model';
import { StudyService } from './study.service';

@Resolver(() => Flashcard)
@UseGuards(GqlAuthGuard)
export class StudyResolver {
  constructor(private readonly studyService: StudyService) {}

  /**
   * RF04: Query GraphQL para buscar a Fila Diária de Estudos (Bypass + Revisão + Novos)
   * Retorna uma lista de cartões combinados e embaralhados de forma randômica.
   */
  @Query(() => [Flashcard], { name: 'dueFlashcards' })
  async getDueFlashcards(
    @CurrentUser() user: User,
    @Args('deckId', { type: () => ID }) deckId: string,
  ): Promise<Flashcard[]> {
    return this.studyService.dueFlashcards(user.id, deckId);
  }

  /**
   * RF05: Mutation GraphQL para submeter a avaliação de retenção da pílula de estudo.
   * Retorna o estado FSRS EFETIVO (pós-leech) para o frontend decidir o reenqueue.
   */
  @Mutation(() => ReviewResult, { name: 'submitReview' })
  async submitReview(
    @CurrentUser() user: User,
    @Args('flashcardId', { type: () => ID }) flashcardId: string,
    @Args('rating', { type: () => Int }) rating: number,
    @Args('reviewDurationMs', { type: () => Int, defaultValue: 0 })
    reviewDurationMs: number,
  ): Promise<ReviewResult> {
    return this.studyService.submitReview(
      user.id,
      flashcardId,
      rating,
      reviewDurationMs,
    );
  }

  /**
   * UC10 (Modo Chaos): Query GraphQL para buscar a Fila Global de Estudos
   * Mistura matérias (Interleaving) para gerar "Dificuldades Desejáveis" na retenção.
   */
  @Query(() => [Flashcard], { name: 'chaosStudyQueue' })
  async getChaosStudyQueue(
    @CurrentUser() user: User,
    @Args('limit', { type: () => Int, defaultValue: 50, nullable: true })
    limit: number,
  ): Promise<Flashcard[]> {
    return this.studyService.getChaosStudyQueue(user.id, limit);
  }
}
