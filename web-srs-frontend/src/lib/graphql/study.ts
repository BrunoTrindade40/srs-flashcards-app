// src/lib/graphql/study.ts
import { gql } from '@apollo/client';

export const GET_DUE_FLASHCARDS = gql`
  query GetDueFlashcards($deckId: String!) {
    dueFlashcards(deckId: $deckId) {
      id
      front
      back
    }
  }
`;

export const SUBMIT_REVIEW = gql`
  mutation SubmitReview($flashcardId: String!, $rating: Int!) {
    submitReview(flashcardId: $flashcardId, rating: $rating)
  }
`;

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface GetDueFlashcardsData {
  dueFlashcards: Flashcard[];
}