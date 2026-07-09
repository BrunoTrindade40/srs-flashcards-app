import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { Flashcard } from '../flashcard/models/flashcard.model';
import { StudyService } from './study.service';

@Resolver()
export class StudyResolver {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly studyService: StudyService) { }

  @Query(() => [Flashcard])
  @UseGuards(GqlAuthGuard)
  async dueFlashcards(
    @Args('deckId', { type: () => String }) deckId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.studyService.getDueFlashcards(deckId, user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async submitReview(
    @Args('flashcardId', { type: () => String }) flashcardId: string,
    @Args('rating', { type: () => Int }) rating: number,
    @CurrentUser() user: { id: string },
  ) {
    await this.studyService.submitReview(flashcardId, user.id, rating);
    return true;
  }
}
