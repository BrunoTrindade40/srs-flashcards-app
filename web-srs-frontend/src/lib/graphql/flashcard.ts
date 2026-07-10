import { gql } from '@apollo/client';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

// --- MUTATION: Criação ---
export interface CreateFlashcardResponse {
  createFlashcard: Flashcard;
}

export interface CreateFlashcardVariables {
  data: {
    front: string;
    back: string;
    deckId: string;
  };
}

export const CREATE_FLASHCARD = gql`
  mutation CreateFlashcard($data: CreateFlashcardInput!) {
    createFlashcard(data: $data) {
      id
      front
      back
    }
  }
`;

// --- QUERY: Listagem (Corrigido para 'deckFlashcards') ---
export interface GetDeckFlashcardsResponse {
  deckFlashcards: Flashcard[];
}

export interface GetDeckFlashcardsVariables {
  deckId: string;
}

export const GET_DECK_FLASHCARDS = gql`
  query DeckFlashcards($deckId: ID!) {
    deckFlashcards(deckId: $deckId) {
      id
      front
      back
    }
  }
`;

// --- MUTATION: Deleção (Corrigido para 'removeFlashcard') ---
export interface RemoveFlashcardResponse {
  removeFlashcard: Flashcard;
}

export interface RemoveFlashcardVariables {
  id: string;
}

export const REMOVE_FLASHCARD = gql`
  mutation RemoveFlashcard($id: ID!) {
    removeFlashcard(id: $id) {
      id
    }
  }
`;