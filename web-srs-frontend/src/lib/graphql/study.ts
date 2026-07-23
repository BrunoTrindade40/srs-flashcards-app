import { gql, type TypedDocumentNode } from '@apollo/client/core';

//Tipagens de Retorno e Variáveis
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
  reviewDurationMs: number; // Coleta da latência para o TCC 2
}

// 2. Documentos GraphQL
// CORREÇÃO DEFINITIVA: O parâmetro está como $deckId: ID!
export const GET_DUE_FLASHCARDS: TypedDocumentNode<GetDueFlashcardsResponse, GetDueFlashcardsVariables> = gql`
  query GetDueFlashcards($deckId: ID!) {
    dueFlashcards(deckId: $deckId) {
      id
      front
      back
    }
  }
`;

// CORREÇÃO: $flashcardId agora é do tipo ID! e adicionamos a métrica de duração
export const SUBMIT_REVIEW: TypedDocumentNode<SubmitReviewResponse, SubmitReviewVariables> = gql`
  mutation SubmitReview($flashcardId: ID!, $rating: Int!, $reviewDurationMs: Int!) {
    submitReview(flashcardId: $flashcardId, rating: $rating, reviewDurationMs: $reviewDurationMs)
  }
`;