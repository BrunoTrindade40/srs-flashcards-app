import { registerEnumType } from '@nestjs/graphql';

/**
 * Estado FSRS do card — espelha os valores Int persistidos no Prisma (CardFSRSData.state).
 * 0=NEW · 1=LEARNING · 2=REVIEW · 3=RELEARNING · 4=SUSPENDED (leech protection).
 */
export enum CardState {
  NEW = 0,
  LEARNING = 1,
  REVIEW = 2,
  RELEARNING = 3,
  SUSPENDED = 4,
}

registerEnumType(CardState, {
  name: 'CardState',
  description: 'Estado FSRS do card após leech protection.',
});
