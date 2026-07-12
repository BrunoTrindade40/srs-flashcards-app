import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

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

  @Field(() => Date, { nullable: true })
  lastDataExportAt?: Date | null;

  @Field(() => Date, { nullable: true })
  lastNotificationSentAt?: Date | null;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;

  // Parâmetros de Rollover & Gamificação (Integrados ao User)
  @Field(() => Int)
  dailyNewCardLimit!: number;

  @Field(() => Int)
  maxDailyReviews!: number;

  @Field(() => Int)
  currentStreak!: number;

  @Field(() => Int)
  longestStreak!: number;

  @Field(() => String, { nullable: true })
  pillReminderTime?: string | null;
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
  pillReminderTime?: string;
}
