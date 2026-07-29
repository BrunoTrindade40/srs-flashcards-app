import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

@InputType()
export class CreateFlashcardInput {
  // 🔴 CORREÇÃO: Uso do operador '!' indicando atribuição definida pelo NestJS
  @Field()
  @IsUUID()
  @IsNotEmpty()
  deckId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  front!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  back!: string;

  // Campos opcionais (Fase 2) não precisam do '!' pois já utilizam '?'
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
}