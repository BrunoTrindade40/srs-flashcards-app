import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { CreateFlashcardInput } from './create-flashcard.input';

@InputType()
export class UpdateFlashcardInput extends PartialType(CreateFlashcardInput) {
  // 🔴 CORREÇÃO: Uso do operador '!' indicando atribuição definida pelo NestJS
  @Field()
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}