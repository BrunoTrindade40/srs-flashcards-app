import { gql, type TypedDocumentNode } from "@apollo/client/core";

export interface CardFSRSData {
  state: string;
  repetitions: number;
}

export interface FlashcardInStudy {
  id: string;
  front?: string | null;
  back?: string | null;
  sourceContext?: string | null;
  fsrsData?: CardFSRSData | null;
}

export interface GetDueFlashcardsResponse {
  dueFlashcards: FlashcardInStudy[];
}

export interface GetDueFlashcardsVariables {
  deckId: string;
}

export const GET_DUE_FLASHCARDS: TypedDocumentNode<
  GetDueFlashcardsResponse,
  GetDueFlashcardsVariables
> = gql`
  query GetDueFlashcards($deckId: ID!) {
    dueFlashcards(deckId: $deckId) {
      id
      front
      back
      sourceContext
      fsrsData {
        state
        repetitions
      }
    }
  }
`;

export interface SubmitReviewVariables {
  flashcardId: string;
  rating: number;
  reviewDurationMs: number;
}

export interface SubmitReviewResponse {
  submitReview: boolean;
}

export const SUBMIT_REVIEW: TypedDocumentNode<
  SubmitReviewResponse,
  SubmitReviewVariables
> = gql`
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
`;