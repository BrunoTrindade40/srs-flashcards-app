import { graphql } from "../../gql";

export const GET_DUE_FLASHCARDS = graphql(`
  query GetDueFlashcards($deckId: ID!) {
    dueFlashcards(deckId: $deckId) {
      id
      frontContent
      backContent
      sourceContext
      due
    }
  }
`);

export const SUBMIT_REVIEW = graphql(`
  mutation SubmitReview($flashcardId: ID!, $rating: Int!, $reviewDurationMs: Int!) {
    submitReview(
      flashcardId: $flashcardId, 
      rating: $rating, 
      reviewDurationMs: $reviewDurationMs 
    )
  }
`);