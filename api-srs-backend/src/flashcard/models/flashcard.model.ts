import { Field, ID, InputType, ObjectType, PartialType } from '@nestjs/graphql';

@ObjectType()
export class Flashcard {
  @Field(() => ID)
  id!: string;

  @Field()
  front!: string;

  @Field()
  back!: string;

  @Field({ nullable: true })
  sourceContext?: string | null;

  // Representa o CardStatus do banco (NEW, LEARNING, REVIEW, RELEARNING)
  @Field()
  status!: string;

  @Field()
  due!: Date;

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

  @Field({ nullable: true })
  sourceContext?: string | null;

  @Field(() => ID)
  deckId!: string;
}

@InputType()
export class UpdateFlashcardInput extends PartialType(CreateFlashcardInput) {
  @Field(() => ID)
  id!: string;
}
