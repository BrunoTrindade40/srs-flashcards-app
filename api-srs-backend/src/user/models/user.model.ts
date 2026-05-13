import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Representa o Estudante no sistema SRS' })
export class User {
  @Field(() => ID)
  id!: string;

  @Field({ description: 'Identificador único vinculado ao Supabase Auth' })
  authId!: string;

  // Propriedades opcionais utilizam interrogação (?) e não requerem a exclamação
  @Field({ nullable: true })
  name?: string;

  @Field()
  email!: string;

  @Field(() => Int, {
    description: 'Acúmulo de pontos de experiência (Gamificação)',
  })
  totalXp!: number;

  @Field(() => Int)
  currentStreak!: number;
}
