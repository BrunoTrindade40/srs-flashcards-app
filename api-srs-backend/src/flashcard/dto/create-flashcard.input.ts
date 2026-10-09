import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class CreateFlashcardInput {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  deckId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  frontContent!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  backContent!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  sourceContext?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  // 🔴 CORREÇÃO CRÍTICA: Recebimento opcional das flags de IA (UC16)
  @Field(() => Boolean, { nullable: true, defaultValue: false })
  @IsBoolean()
  @IsOptional()
  isEditedAfterAi?: boolean;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  aiModelSource?: string;
  
}