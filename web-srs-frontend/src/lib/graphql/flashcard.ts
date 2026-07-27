import { gql, type TypedDocumentNode } from '@apollo/client/core';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  sourceContext?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
}

// --- MUTATION: Create Flashcard ---
export interface CreateFlashcardResponse {
  createFlashcard: Flashcard;
}

export interface CreateFlashcardVariables {
  data: {
    deckId: string;
    front: string;
    back: string;
    sourceContext?: string;
    imageUrl?: string;
    audioUrl?: string;
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
      sourceContext
      imageUrl
      audioUrl
    }
  }
`;

// --- MUTATION: Update Flashcard ---
export interface UpdateFlashcardResponse {
  updateFlashcard: Flashcard;
}

export interface UpdateFlashcardVariables {
  data: {
    id: string;
    front?: string;
    back?: string;
    sourceContext?: string;
    imageUrl?: string;
    audioUrl?: string;
  };
}

export const UPDATE_FLASHCARD: TypedDocumentNode<
  UpdateFlashcardResponse,
  UpdateFlashcardVariables
> = gql`
  mutation UpdateFlashcard($data: UpdateFlashcardInput!) {
    updateFlashcard(data: $data) {
      id
      front
      back
      sourceContext
      imageUrl
      audioUrl
    }
  }
`;

// --- MUTATION: Remove Flashcard ---
export interface RemoveFlashcardResponse {
  removeFlashcard: { id: string };
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