import { graphql } from "../../gql";

// Enumeração isolada e segura para controle de fluxo no Frontend
export const FSRSState = {
  NEW: "NEW",
  LEARNING: "LEARNING",
  REVIEW: "REVIEW",
  RELEARNING: "RELEARNING",
} as const;

export type FSRSState = (typeof FSRSState)[keyof typeof FSRSState];

export const GET_DUE_FLASHCARDS = graphql(`
  query GetDueFlashcards($deckId: ID!) {
    dueFlashcards(deckId: $deckId) {
      id
      frontContent
      backContent
      sourceContext
      
      # Lemos apenas o 'state', que é efetivamente utilizado pelo useStudyEngine.
      # O campo 'repetitions' foi removido por YAGNI (Over-fetching).
      state
    }
  }
`);

export const SUBMIT_REVIEW = graphql(`
  mutation SubmitReview(
    $flashcardId: ID!
    $rating: Int!
    $reviewDurationMs: Int!
  ) {
    submitReview(
      flashcardId: $flashcardId
      rating: $rating
      reviewDurationMs: $reviewDurationMs
    )
  }
`);