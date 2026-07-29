import { Field, ID, ObjectType } from '@nestjs/graphql';

/**
 * Mapeamento do Modelo GraphQL (Code-First) para a entidade Flashcard.
 */
@ObjectType()
export class Flashcard {
  @Field(() => ID)
  id!: string;

  @Field()
  deckId!: string;

  @Field()
  front!: string;

  @Field()
  back!: string;

  // 🔴 CORREÇÃO CRÍTICA: Declaração explícita de tipo (() => String)
  // exigida pelo NestJS quando a tipagem TS é uma união (string | null).
  @Field(() => String, { nullable: true })
  sourceContext?: string | null;

  @Field(() => String, { nullable: true })
  imageUrl?: string | null;

  @Field(() => String, { nullable: true })
  audioUrl?: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}