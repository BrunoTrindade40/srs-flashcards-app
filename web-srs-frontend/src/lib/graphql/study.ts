import { gql, type TypedDocumentNode } from '@apollo/client/core';

export interface FlashcardDue {
  id: string;
  front: string;
  back: string;
  sourceContext?: string | null; // Tipagem rigorosa em alinhamento com o Prisma/NestJS
  imageUrl?: string | null;
  audioUrl?: string | null;
  deck?: {
    id: string;
    title: string;
  };
}

// --- Query: Flashcards Agendados (Sessão Padrão) ---
export interface GetDueFlashcardsResponse {
  dueFlashcards: FlashcardDue[];
}
export interface GetDueFlashcardsVariables {
  deckId: string;
}
export const GET_DUE_FLASHCARDS: TypedDocumentNode<GetDueFlashcardsResponse, GetDueFlashcardsVariables> = gql`
  query GetDueFlashcards($deckId: ID!) {
    dueFlashcards(deckId: $deckId) {
      id
      front
      back
      sourceContext
      imageUrl
      audioUrl
    }
  }
`;

// --- Query: MODO CHAOS ---
export interface GetChaosStudyQueueResponse {
  chaosStudyQueue: FlashcardDue[];
}
export interface GetChaosStudyQueueVariables {
  limit?: number;
}
export const GET_CHAOS_STUDY_QUEUE: TypedDocumentNode<GetChaosStudyQueueResponse, GetChaosStudyQueueVariables> = gql`
  query GetChaosStudyQueue($limit: Int) {
    chaosStudyQueue(limit: $limit) {
      id
      front
      back
      sourceContext
      imageUrl
      audioUrl
      deck {
        id
        title
      }
    }
  }
`;

// --- Mutation: Submissão de Revisão FSRS ---
export interface SubmitReviewResponse {
  submitReview: boolean;
}

export interface SubmitReviewVariables {
  flashcardId: string;
  rating: number; // 1: AGAIN, 2: HARD, 3: GOOD, 4: EASY
  reviewDurationMs: number;
}

export const SUBMIT_REVIEW: TypedDocumentNode<SubmitReviewResponse, SubmitReviewVariables> = gql`
  mutation SubmitReview($flashcardId: ID!, $rating: Int!, $reviewDurationMs: Int!) {
    submitReview(flashcardId: $flashcardId, rating: $rating, reviewDurationMs: $reviewDurationMs)
  }
`;