import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { CardState } from '@prisma/client';

@ObjectType()
export class Flashcard {
  @Field(() => ID)
  id!: string;

  @Field()
  deckId!: string;

  @Field()
  frontContent!: string;

  @Field()
  backContent!: string;

  @Field(() => String, { nullable: true })
  sourceContext?: string | null;

  @Field(() => String, { nullable: true })
  imageUrl?: string | null;

  @Field(() => String, { nullable: true })
  audioUrl?: string | null;

  // 🔴 CORREÇÃO CRÍTICA: Conversão da Magic String (status) para Booleano (isPublished)
  @Field(() => Boolean, { defaultValue: true })
  isPublished!: boolean;

  @Field(() => Boolean, { defaultValue: false })
  isEditedAfterAi!: boolean;

  @Field(() => String, { nullable: true })
  aiModelSource?: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  // 🔵 VIRTUAL FIELDS: Resolvidos nativamente pelo Dataloader
  @Field(() => Date, { nullable: true, description: 'Data agendada pelo FSRS' })
  due?: Date | null;

  @Field(() => CardState, {
    nullable: true,
    description:
      'Estado FSRS do card: NEW · LEARNING · REVIEW · RELEARNING · SUSPENDED (leech)',
  })
  state?: CardState | null;
}
