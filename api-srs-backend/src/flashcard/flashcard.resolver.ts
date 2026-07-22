import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { FlashcardService } from './flashcard.service';
import {
  CreateFlashcardInput,
  Flashcard,
  UpdateFlashcardInput,
} from './models/flashcard.model';

@Resolver(() => Flashcard)
@UseGuards(GqlAuthGuard)
export class FlashcardResolver {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly flashcardService: FlashcardService) {}

  @Mutation(() => Flashcard)
  async createFlashcard(
    @CurrentUser() user: { id: string },
    @Args('data') data: CreateFlashcardInput,
  ): Promise<Flashcard> {
    return this.flashcardService.createFlashcard(user.id, data);
  }

  @Query(() => [Flashcard], { name: 'deckFlashcards' })
  async getDeckFlashcards(
    @CurrentUser() user: { id: string },
    @Args('deckId', { type: () => ID }) deckId: string,
  ): Promise<Flashcard[]> {
    return this.flashcardService.getFlashcardsByDeck(user.id, deckId);
  }

  @Mutation(() => Flashcard)
  async updateFlashcard(
    @CurrentUser() user: { id: string },
    @Args('data') data: UpdateFlashcardInput,
  ): Promise<Flashcard> {
    return this.flashcardService.updateFlashcard(user.id, data);
  }

  @Mutation(() => Flashcard)
  async removeFlashcard(
    @CurrentUser() user: { id: string },
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Flashcard> {
    return this.flashcardService.anonymizeFlashcard(user.id, id);
  }
}
