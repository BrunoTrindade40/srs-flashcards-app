import { Field, ID, InputType, ObjectType, PartialType } from '@nestjs/graphql';

@ObjectType()
export class Deck {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  // Declaração explícita do tipo escalar String para o GraphQL
  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  sourceLanguage?: string | null;

  @Field(() => String, { nullable: true })
  targetLanguage?: string | null;

  @Field()
  isArchived!: boolean;

  @Field()
  creatorId!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@InputType()
export class CreateDeckInput {
  @Field()
  title!: string;

  // Declaração explícita do tipo escalar String para o InputType
  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true, defaultValue: 'pt-BR' })
  sourceLanguage?: string | null;

  @Field(() => String, { nullable: true })
  targetLanguage?: string | null;
}

@InputType()
export class UpdateDeckInput extends PartialType(CreateDeckInput) {
  @Field(() => ID)
  id!: string;

  @Field({ nullable: true })
  isArchived?: boolean;
}
