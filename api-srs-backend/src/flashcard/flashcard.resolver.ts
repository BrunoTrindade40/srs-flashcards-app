import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
// 🔴 CORREÇÃO CRÍTICA: Padrão Alias estabelecido como única fonte da verdade
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { User } from '../user/models/user.model';
import { CreateFlashcardInput } from './dto/create-flashcard.input';
import { UpdateFlashcardInput } from './dto/update-flashcard.input';
import { FlashcardService } from './flashcard.service';
import {
  Flashcard,
} from './models/flashcard.model';

@Resolver(() => Flashcard)
@UseGuards(GqlAuthGuard)
export class FlashcardResolver {
  constructor(private readonly flashcardService: FlashcardService) { }

  @Mutation(() => Flashcard)
  async createFlashcard(
    // 🟡 CORREÇÃO ALERTA: Consistência de Tipagem garantindo a fonte da verdade
    @CurrentUser() user: User,
    @Args('data') data: CreateFlashcardInput,
  ): Promise<Flashcard> {
    return this.flashcardService.createFlashcard(user.id, data);
  }

  @Query(() => [Flashcard], { name: 'deckFlashcards' })
  async getDeckFlashcards(
    @CurrentUser() user: User,
    @Args('deckId', { type: () => ID }) deckId: string,
  ): Promise<Flashcard[]> {
    return this.flashcardService.getFlashcardsByDeck(user.id, deckId);
  }

  @Mutation(() => Flashcard)
  async updateFlashcard(
    @CurrentUser() user: User,
    @Args('data') data: UpdateFlashcardInput,
  ): Promise<Flashcard> {
    return this.flashcardService.updateFlashcard(user.id, data);
  }

  @Mutation(() => Flashcard)
  async removeFlashcard(
    @CurrentUser() user: User,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Flashcard> {
    return this.flashcardService.anonymizeFlashcard(user.id, id);
  }
}
