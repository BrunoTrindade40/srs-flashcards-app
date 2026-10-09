import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  email!: string;

  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field(() => Boolean)
  isAnonymized!: boolean;

  @Field(() => Int)
  totalXp!: number;

  @Field(() => String)
  timezone!: string;

  // 🟡 ALERTA CORRIGIDO: Exposição do campo movido do antigo modelo Settings
  @Field(() => String, { nullable: true })
  dailyRolloverTime?: string | null;

  @Field(() => Date, { nullable: true })
  lastDataExportAt?: Date | null;

  @Field(() => Date, { nullable: true })
  lastNotificationSentAt?: Date | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  @Field(() => Int)
  dailyNewCardLimit!: number;

  @Field(() => Int)
  maxDailyReviews!: number;

  @Field(() => Int)
  currentStreak!: number;

  @Field(() => Int)
  longestStreak!: number;
}

@InputType()
export class UpdateUserSettingsInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  dailyNewCardLimit?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(1000)
  maxDailyReviews?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  timezone?: string;

  // 🟡 ALERTA CORRIGIDO: Injeção do campo no InputType com validação severa
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato inválido. Use HH:mm' })
  dailyRolloverTime?: string;
}