import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { Flashcard } from '../flashcard/models/flashcard.model';
import { User } from '../user/models/user.model';
import { StudyService } from './study.service';


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
    @CurrentUser() user: User,
    @Args('deckId', { type: () => ID }) deckId: string,
  ): Promise<Flashcard[]> { // <-- Alterado de PrismaFlashcard[] para Flashcard[]
    // O cast explícito (as unknown as Flashcard[]) pode ser omitido se as propriedades coincidirem 1:1,
    // pois o TypeScript fará o duck-typing nativo.
    return this.studyService.dueFlashcards(user.id, deckId);
  }

  /**
   * RF05: Mutation GraphQL para submeter a avaliação de retenção da pílula de estudo
   * Coleta a nota (1-4) e a latência de resposta para alimentar a telemetria do TCC 2.
   */
  @Mutation(() => Boolean, { name: 'submitReview' })
  async submitReview(
    @CurrentUser() user: User,
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

  /**
   * UC10 (Modo Chaos): Query GraphQL para buscar a Fila Global de Estudos
   * Mistura matérias (Interleaving) para gerar "Dificuldades Desejáveis" na retenção.
   */
  @Query(() => [Flashcard], { name: 'chaosStudyQueue' })
  async getChaosStudyQueue(
    @CurrentUser() user: User,
    @Args('limit', { type: () => Int, defaultValue: 50, nullable: true })
    limit: number,
  ): Promise<Flashcard[]> { // <-- Alterado de PrismaFlashcard[] para Flashcard[]
    // 🔵 SUGESTÃO APLICADA: Cast removido. Confiamos no Duck Typing do TypeScript.
    return this.studyService.getChaosStudyQueue(user.id, limit);
  }
}