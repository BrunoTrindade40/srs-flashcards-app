import { Field, ID, InputType, ObjectType, PartialType } from '@nestjs/graphql';

@ObjectType()
export class Flashcard {
  @Field(() => ID)
  id!: string;

  @Field()
  front!: string;

  @Field()
  back!: string;

  // Declaração explícita do tipo String para propriedades anuláveis
  @Field(() => String, { nullable: true })
  sourceContext?: string | null;

  @Field()
  status!: string;

  @Field(() => ID)
  deckId!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@InputType()
export class CreateFlashcardInput {
  @Field()
  front!: string;

  @Field()
  back!: string;

  // Declaração explícita do tipo String para o InputType
  @Field(() => String, { nullable: true })
  sourceContext?: string | null;

  @Field(() => ID)
  deckId!: string;
}

@InputType()
export class UpdateFlashcardInput extends PartialType(CreateFlashcardInput) {
  @Field(() => ID)
  id!: string;
}
