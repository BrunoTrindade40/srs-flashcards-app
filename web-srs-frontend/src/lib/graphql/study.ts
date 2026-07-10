import { gql } from '@apollo/client';

// 1. Tipagens de Retorno e Variáveis (Zero 'any')
export interface FlashcardDue {
  id: string;
  front: string;
  back: string;
}

export interface GetDueFlashcardsResponse {
  dueFlashcards: FlashcardDue[];
}

export interface GetDueFlashcardsVariables {
  deckId: string;
}

export interface SubmitReviewResponse {
  submitReview: boolean;
}

export interface SubmitReviewVariables {
  flashcardId: string;
  rating: number; // 1: AGAIN, 2: HARD, 3: GOOD, 4: EASY
}

// 2. Documentos GraphQL
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