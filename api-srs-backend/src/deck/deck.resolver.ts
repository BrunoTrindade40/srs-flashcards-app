import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import * as Prisma from '@prisma/client'; // Correção para isolatedModules
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { DeckService } from './deck.service';
import { CreateDeckInput, Deck, UpdateDeckInput } from './models/deck.model';

@Resolver(() => Deck)
@UseGuards(GqlAuthGuard)
export class DeckResolver {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly deckService: DeckService) { }

  @Mutation(() => Deck)
  async createDeck(
    @CurrentUser() user: Prisma.User, // Utilização segura do tipo via Namespace
    @Args('data') data: CreateDeckInput,
  ): Promise<Deck> {
    return this.deckService.createDeck(user.id, data);
  }

  @Query(() => [Deck], { name: 'myDecks' })
  async getMyDecks(@CurrentUser() user: Prisma.User): Promise<Deck[]> {
    return this.deckService.getUserDecks(user.id);
  }

  @Query(() => Deck, { name: 'deck' })
  async getDeck(
    @CurrentUser() user: Prisma.User,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Deck> {
    return this.deckService.getDeckById(user.id, id);
  }

  @Mutation(() => Deck)
  async updateDeck(
    @CurrentUser() user: Prisma.User,
    @Args('data') data: UpdateDeckInput,
  ): Promise<Deck> {
    return this.deckService.updateDeck(user.id, data);
  }

  @Mutation(() => Deck)
  async archiveDeck(
    @CurrentUser() user: Prisma.User,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Deck> {
    return this.deckService.archiveDeck(user.id, id);
  }
}
