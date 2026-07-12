import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { Flashcard } from '../flashcard/models/flashcard.model';
import { StudyService } from './study.service';

// Interface estrita para o utilizador autenticado (Zero 'any')
export interface AuthUserPayload {
  id: string;
  email?: string;
  authId?: string;
}

@Resolver(() => Flashcard)
@UseGuards(GqlAuthGuard)
export class StudyResolver {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly studyService: StudyService) { }

  @Query(() => [Flashcard], { name: 'dueFlashcards' })
  async getDueFlashcards(
    @CurrentUser() user: AuthUserPayload,
    @Args('deckId', { type: () => ID }) deckId: string,
  ) {
    // CORREÇÃO 1: O método agora chama-se 'dueFlashcards' (igual ao Service)
    // CORREÇÃO 2: A ordem dos parâmetros é estritamente (user.id, deckId)
    return this.studyService.dueFlashcards(user.id, deckId);
  }

  @Mutation(() => Boolean, { name: 'submitReview' })
  async submitReview(
    @CurrentUser() user: AuthUserPayload,
    @Args('flashcardId', { type: () => ID }) flashcardId: string,
    @Args('rating', { type: () => Int }) rating: number,
  ) {
    return this.studyService.submitReview(user.id, flashcardId, rating);
  }
}
