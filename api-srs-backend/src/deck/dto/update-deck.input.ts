import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

@InputType()
export class UpdateDeckInput {
  @Field(() => ID, { description: 'ID do baralho que sofrerá a mutação' })
  @IsUUID(4, {
    message: 'O identificador do baralho precisa ser um UUID válido v4.',
  })
  id!: string; // Operador de atribuição definitiva inserido

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
