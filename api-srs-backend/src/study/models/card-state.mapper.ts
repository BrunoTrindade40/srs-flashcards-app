import { CardState } from '@prisma/client';
import { State } from 'ts-fsrs';

/**
 * State numérico do ts-fsrs (0–3) -> enum Prisma CardState.
 * SUSPENDED (4) NÃO existe no ts-fsrs: é aplicado por código (leech protection).
 */
export function toCardState(state: State): CardState {
  switch (state) {
    case State.New:
      return CardState.NEW;
    case State.Learning:
      return CardState.LEARNING;
    case State.Review:
      return CardState.REVIEW;
    case State.Relearning:
      return CardState.RELEARNING;
    default:
      throw new Error(`Estado FSRS inválido: ${state}`);
  }
}

/**
 * enum Prisma CardState -> State numérico do ts-fsrs.
 * SUSPENDED é terminal (leech) e JAMAIS entra no pipeline do algoritmo.
 */
export function toFsrsState(state: CardState): State {
  switch (state) {
    case CardState.NEW:
      return State.New;
    case CardState.LEARNING:
      return State.Learning;
    case CardState.REVIEW:
      return State.Review;
    case CardState.RELEARNING:
      return State.Relearning;
    case CardState.SUSPENDED:
      throw new Error('CardState.SUSPENDED não entra no pipeline do FSRS');
  }
}
