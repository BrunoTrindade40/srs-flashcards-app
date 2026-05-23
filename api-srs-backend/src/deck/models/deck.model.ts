import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

@ObjectType()
export class Deck {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  title!: string;

  // Correção: Tipagem explícita com null para espelhar o comportamento do Prisma
  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => String, { defaultValue: 'pt-BR' })
  sourceLanguage!: string | null;

  @Field(() => String, { nullable: true })
  targetLanguage!: string | null;

  @Field(() => Boolean)
  isArchived!: boolean;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@InputType()
export class CreateDeckInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: 'O título do Deck não pode estar vazio.' })
  @MaxLength(100, { message: 'O título deve ter no máximo 100 caracteres.' })
  title!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'A descrição não pode exceder 500 caracteres.' })
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

@InputType()
export class UpdateDeckInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  id!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  title?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  sourceLanguage?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  targetLanguage?: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}
