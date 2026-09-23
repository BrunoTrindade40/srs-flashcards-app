import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { CardState } from '@prisma/client';

/**
 * Registra o enum no schema GraphQL para o frontend consumir via codegen.
 */
registerEnumType(CardState, {
  name: 'CardState',
  description:
    'Estado FSRS do card após leech protection. NEW · LEARNING · REVIEW · RELEARNING · SUSPENDED (leech).',
});

/**
 * RF05: Resultado da mutation submitReview.
 * state: estado FSRS EFETIVO após leech protection.
 */
@ObjectType()
export class ReviewResult {
  @Field(() => CardState)
  state!: CardState;
}
