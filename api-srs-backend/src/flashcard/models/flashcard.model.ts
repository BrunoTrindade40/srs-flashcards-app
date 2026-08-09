import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

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

  @Field(() => Int, { nullable: true, description: '0=NEW, 1=LEARN, 2=REVIEW, 3=RELEARN' })
  state?: number | null;
}