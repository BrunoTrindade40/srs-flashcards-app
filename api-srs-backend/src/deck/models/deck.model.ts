// src/deck/models/deck.model.ts
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

// 1. DECLARAÇÃO DA CLASSE AGREGADORA (Deve vir antes do modelo principal)
@ObjectType({ description: 'Agregador de contagem de relações do baralho' })
export class DeckCount {
  @Field(() => Int, {
    description: 'Quantidade total de flashcards associados a este baralho',
  })
  flashcards!: number; // Operador de atribuição definitiva (!) aplicado
}

// 2. DECLARAÇÃO DO MODELO PRINCIPAL
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

  // Associação estrita e opcional com a classe DeckCount declarada acima
  @Field(() => DeckCount, {
    nullable: true,
    description: 'Agregador com contagem de relações',
  })
  _count?: DeckCount | null;
}
