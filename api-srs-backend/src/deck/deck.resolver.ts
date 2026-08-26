import { UseGuards } from '@nestjs/common';
import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { User } from '../user/models/user.model';
import { DeckService } from './deck.service';
import { CreateDeckInput } from './dto/create-deck.input';
import { UpdateDeckInput } from './dto/update-deck.input';
import { Deck, DeckCount } from './models/deck.model';

@Resolver(() => Deck)
@UseGuards(GqlAuthGuard)
export class DeckResolver {
  constructor(private readonly deckService: DeckService) { }

  @Query(() => [Deck], { name: 'myDecks' })
  async getMyDecks(@CurrentUser() user: User) {
    return this.deckService.findMyDecks(user.id);
  }

  @Query(() => Deck, { name: 'deck' })
  async getDeck(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ) {
    return this.deckService.findById(id, user.id);
  }

  @Mutation(() => Deck, { name: 'createDeck' })
  async createDeck(
    @Args('data') data: CreateDeckInput,
    @CurrentUser() user: User,
  ) {
    return this.deckService.create(data, user.id);
  }

  @Mutation(() => Deck, { name: 'updateDeck' })
  async updateDeck(
    @Args('data') data: UpdateDeckInput,
    @CurrentUser() user: User,
  ) {
    return this.deckService.update(data, user.id);
  }

  /**
   * NOVO: Mutation GraphQL com Escopo e Responsabilidade Única (Arquivamento vs Deleção)
   */
  @Mutation(() => Deck, { name: 'toggleDeckArchive' })
  async toggleDeckArchive(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ) {
    return this.deckService.toggleArchive(id, user.id);
  }

  @Mutation(() => Boolean, { name: 'removeDeck' })
  async removeDeck(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.deckService.remove(id, user.id);
  }

  @ResolveField(() => DeckCount, { name: '_count', nullable: true })
  async getCount(@Parent() deck: Deck): Promise<DeckCount> {
    if (deck._count && typeof deck._count.flashcards === 'number') {
      return deck._count;
    }
    const count = await this.deckService.countFlashcards(deck.id);
    return { flashcards: count };
  }

  @Mutation(() => Boolean, { name: 'enrollInDeck' })
  async enrollInDeck(
    @Args('deckId', { type: () => ID }) deckId: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.deckService.enrollInDeck(deckId, user.id);
  }

  @Mutation(() => Boolean, { name: 'unenrollFromDeck' })
  async unenrollFromDeck(
    @Args('deckId', { type: () => ID }) deckId: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.deckService.unenrollFromDeck(deckId, user.id);
  }
}