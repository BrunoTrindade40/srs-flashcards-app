import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
// 🔴 CRÍTICO CORRIGIDO: Importação do modelo filho
import { Flashcard } from '../../flashcard/models/flashcard.model';

@ObjectType({ description: 'Agregador de contagem de relações do baralho' })
export class DeckCount {
  @Field(() => Int, {
    description: 'Quantidade total de flashcards associados a este baralho',
  })
  flashcards!: number;
}

@ObjectType({ description: 'Modelo principal do baralho de estudos' })
export class Deck {
  @Field(() => ID, { description: 'Identificador único do baralho (UUID)' })
  id!: string;

  @Field(() => String, { description: 'Título identificador do baralho' })
  title!: string;

  @Field(() => String, {
    nullable: true,
    description: 'Descrição opcional do propósito do baralho',
  })
  description?: string | null;

  @Field(() => String, {
    nullable: true,
    defaultValue: 'pt-BR',
    description: 'Idioma de origem do conteúdo',
  })
  sourceLanguage?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Idioma alvo do aprendizado',
  })
  targetLanguage?: string | null;

  @Field(() => Boolean, {
    description: 'Sinalizador de arquivamento lógico do baralho',
  })
  isArchived!: boolean;

  @Field(() => ID, {
    description: 'Vínculo com o identificador único do utilizador criador',
  })
  creatorId!: string;

  @Field(() => Date, { description: 'Timestamp de criação do registo' })
  createdAt!: Date;

  @Field(() => Date, {
    description: 'Timestamp da última modificação do registo',
  })
  updatedAt!: Date;

  @Field(() => DeckCount, {
    nullable: true,
    description: 'Agregador com contagem de relações',
  })
  _count?: DeckCount | null;

  // 🔴 CRÍTICO CORRIGIDO: Exposição da relação Flashcards para o GraphQL
  // A função de seta () => [Flashcard] resolve dependências circulares do TypeScript
  @Field(() => [Flashcard], {
    nullable: true,
    description: 'Lista de flashcards pertencentes a este baralho',
  })
  flashcards?: Flashcard[] | null;
}