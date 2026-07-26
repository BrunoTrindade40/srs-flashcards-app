import { gql, type TypedDocumentNode } from '@apollo/client/core';

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

export const CREATE_FLASHCARD: TypedDocumentNode<
  CreateFlashcardResponse,
  CreateFlashcardVariables
> = gql`
  mutation CreateFlashcard($data: CreateFlashcardInput!) {
    createFlashcard(data: $data) {
      id
      front
      back
    }
  }
`;

// --- QUERY: Listagem ---
export interface GetDeckFlashcardsResponse {
  deckFlashcards: Flashcard[];
}

export interface GetDeckFlashcardsVariables {
  deckId: string;
}

export const GET_DECK_FLASHCARDS: TypedDocumentNode<
  GetDeckFlashcardsResponse,
  GetDeckFlashcardsVariables
> = gql`
  query DeckFlashcards($deckId: ID!) {
    deckFlashcards(deckId: $deckId) {
      id
      front
      back
    }
  }
`;

// --- MUTATION: Deleção ---
export interface RemoveFlashcardResponse {
  removeFlashcard: Flashcard;
}

export interface RemoveFlashcardVariables {
  id: string;
}

export const REMOVE_FLASHCARD: TypedDocumentNode<
  RemoveFlashcardResponse,
  RemoveFlashcardVariables
> = gql`
  mutation RemoveFlashcard($id: ID!) {
    removeFlashcard(id: $id) {
      id
    }
  }
`;