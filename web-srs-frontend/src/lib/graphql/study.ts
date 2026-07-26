import { gql, type TypedDocumentNode } from '@apollo/client/core';

// Tipagens de Retorno e Variáveis
export interface FlashcardDue {
  id: string;
  front: string;
  back: string;
  deck?: {
    id: string;
    title: string;
  };
}

export interface GetDueFlashcardsResponse {
  dueFlashcards: FlashcardDue[];
}

export interface GetDueFlashcardsVariables {
  deckId: string;
}

export interface GetChaosCardsResponse {
  chaosCards: FlashcardDue[];
}

export interface SubmitReviewResponse {
  submitReview: boolean;
}

export interface SubmitReviewVariables {
  flashcardId: string;
  rating: number; // 1: AGAIN, 2: HARD, 3: GOOD, 4: EASY
  reviewDurationMs: number; // Coleta da latência para o TCC 2
}

// Documentos GraphQL
export const GET_DUE_FLASHCARDS: TypedDocumentNode<GetDueFlashcardsResponse, GetDueFlashcardsVariables> = gql`
  query GetDueFlashcards($deckId: ID!) {
    dueFlashcards(deckId: $deckId) {
      id
      front
      back
    }
  }
`;

// Query para o Modo Chaos (Ignora deckId e traz todos intercalados)
export const GET_CHAOS_CARDS: TypedDocumentNode<GetChaosCardsResponse, Record<string, never>> = gql`
  query GetChaosCards {
    chaosCards {
      id
      front
      back
      deck {
        id
        title
      }
    }
  }
`;

// Mutação oficial do seu schema com telemetria
export const SUBMIT_REVIEW: TypedDocumentNode<SubmitReviewResponse, SubmitReviewVariables> = gql`
  mutation SubmitReview($flashcardId: ID!, $rating: Int!, $reviewDurationMs: Int!) {
    submitReview(flashcardId: $flashcardId, rating: $rating, reviewDurationMs: $reviewDurationMs)
  }
`;