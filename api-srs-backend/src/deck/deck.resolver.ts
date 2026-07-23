import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { User } from '../user/models/user.model';
import { DeckService } from './deck.service';
import { CreateDeckInput } from './dto/create-deck.input';
import { UpdateDeckInput } from './dto/update-deck.input';
import { Deck } from './models/deck.model';

@Resolver(() => Deck)
@UseGuards(GqlAuthGuard) // Garante a proteção perimetral de todas as operações do controlador
export class DeckResolver {
  constructor(private readonly deckService: DeckService) { }

  @Mutation(() => Deck, {
    description: 'Cria um novo baralho de estudos associado ao usuário logado',
  })
  async createDeck(
    @Args('data') createDeckInput: CreateDeckInput,
    // 🟡 CORREÇÃO ALERTA: Consistência de Tipagem garantindo a fonte da verdade
    @CurrentUser() user: User,
  ): Promise<Deck> {
    return this.deckService.create(createDeckInput, user.id);
  }

  @Query(() => [Deck], {
    name: 'myDecks',
    description:
      'Lista todos os baralhos ativos pertencentes ao estudante autenticado',
  })
  async getMyDecks(@CurrentUser() user: User): Promise<Deck[]> {
    return this.deckService.findAllByUser(user.id);
  }

  @Query(() => Deck, {
    name: 'deck',
    description: 'Obtém detalhes de um baralho específico por ID',
  })
  async getDeck(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<Deck> {
    return this.deckService.findOne(id, user.id);
  }

  @Mutation(() => Deck, {
    description: 'Atualiza os dados estruturais de um baralho existente',
  })
  async updateDeck(
    @Args('data') updateDeckInput: UpdateDeckInput,
    @CurrentUser() user: User,
  ): Promise<Deck> {
    return this.deckService.update(updateDeckInput, user.id);
  }

  @Mutation(() => Boolean, {
    description:
      'Exclui definitivamente um baralho e seus flashcards associados do sistema',
  })
  async removeDeck(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.deckService.remove(id, user.id);
  }
}
