import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { CreateFlashcardInput } from './create-flashcard.input';

@InputType()
export class UpdateFlashcardInput extends PartialType(CreateFlashcardInput) {
  // Apenas o 'id' é obrigatório. Todos os campos do CreateFlashcardInput já são inferidos como opcionais.
  @Field()
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  // Injeção da flag de proteção da malha estocástica (RN02)
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  resetProgress?: boolean;
}