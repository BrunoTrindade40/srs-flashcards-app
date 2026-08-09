import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
// 🔴 CORREÇÃO CRÍTICA: Padrão Alias estabelecido como única fonte da verdade
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { User } from '../user/models/user.model';
import { CreateFlashcardInput } from './dto/create-flashcard.input';
import { UpdateFlashcardInput } from './dto/update-flashcard.input';
import { FlashcardService } from './flashcard.service';
import { FsrsDataLoader } from './dataloaders/fsrs.dataloader';
import {
  Flashcard,
} from './models/flashcard.model';

@Resolver(() => Flashcard)
@UseGuards(GqlAuthGuard)
export class FlashcardResolver {
  constructor(private readonly flashcardService: FlashcardService, private readonly fsrsLoader: FsrsDataLoader) { }

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

  // 🔵 RESOLVER VIRTUAL: FSRS Due
  @ResolveField(() => Date, { nullable: true })
  async due(
    @Parent() flashcard: Flashcard,
    @CurrentUser() user: User,
  ): Promise<Date | null> {
    const fsrs = await this.fsrsLoader.loader.load({
      flashcardId: flashcard.id,
      userId: user.id,
    });
    return fsrs?.due || null;
  }

  // 🔵 RESOLVER VIRTUAL: FSRS State
  @ResolveField(() => Int, { nullable: true })
  async state(
    @Parent() flashcard: Flashcard,
    @CurrentUser() user: User,
  ): Promise<number | null> {
    const fsrs = await this.fsrsLoader.loader.load({
      flashcardId: flashcard.id,
      userId: user.id,
    });
    return fsrs?.state ?? 0; // Se não existir log, é novo (0)
  }
}
