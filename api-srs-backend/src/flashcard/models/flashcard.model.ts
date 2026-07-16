import { Field, ID, InputType, ObjectType, PartialType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

@ObjectType()
export class Flashcard {
  @Field(() => ID)
  id!: string;

  @Field()
  front!: string;

  @Field()
  back!: string;

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
  @IsString({ message: 'A frente do cartão deve ser um texto válido.' })
  @IsNotEmpty({ message: 'A frente do cartão não pode estar vazia.' })
  @MaxLength(2000, {
    message: 'A frente excede o limite máximo de 2000 caracteres.',
  })
  front!: string;

  @Field()
  @IsString({ message: 'O verso do cartão deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O verso do cartão não pode estar vazio.' })
  @MaxLength(3000, {
    message: 'O verso excede o limite máximo de 3000 caracteres.',
  })
  back!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'O contexto de origem é muito extenso.' })
  sourceContext?: string | null;

  @Field(() => ID)
  @IsUUID('4', { message: 'O identificador do Deck deve ser um UUID válido.' })
  @IsNotEmpty()
  deckId!: string;
}

@InputType()
export class UpdateFlashcardInput extends PartialType(CreateFlashcardInput) {
  @Field(() => ID)
  @IsUUID('4')
  @IsNotEmpty()
  id!: string;
}
