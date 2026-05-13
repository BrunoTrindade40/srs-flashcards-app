import { Field, ID, InputType, ObjectType, PartialType } from '@nestjs/graphql';

@ObjectType()
export class Deck {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field({ nullable: true })
  description?: string | null;

  @Field({ nullable: true })
  sourceLanguage?: string | null;

  @Field({ nullable: true })
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

  @Field({ nullable: true })
  description?: string | null;

  @Field({ nullable: true, defaultValue: 'pt-BR' })
  sourceLanguage?: string | null;

  @Field({ nullable: true })
  targetLanguage?: string | null;
}

@InputType()
export class UpdateDeckInput extends PartialType(CreateDeckInput) {
  @Field(() => ID)
  id!: string;

  @Field({ nullable: true })
  isArchived?: boolean;
}
