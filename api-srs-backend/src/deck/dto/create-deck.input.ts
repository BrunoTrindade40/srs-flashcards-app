// src/deck/dto/create-deck.input.ts
import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class CreateDeckInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: 'O título do baralho não pode ser vazio.' })
  @MaxLength(100, {
    message: 'O título do baralho deve conter no máximo 100 caracteres.',
  })
  title!: string; // Operador de atribuição definitiva inserido

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(500, {
    message: 'A descrição do baralho deve conter no máximo 500 caracteres.',
  })
  description?: string;

  @Field(() => String, { nullable: true, defaultValue: 'pt-BR' })
  @IsString()
  @IsOptional()
  sourceLanguage?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  targetLanguage?: string;
}
