import { gql, type TypedDocumentNode } from "@apollo/client/core"; // Importação Estrita do Core

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  sourceContext?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
}

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

export const CREATE_FLASHCARD: TypedDocumentNode<CreateFlashcardResponse, CreateFlashcardVariables> = gql`
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

export const UPDATE_FLASHCARD: TypedDocumentNode<UpdateFlashcardResponse, UpdateFlashcardVariables> = gql`
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

export interface RemoveFlashcardResponse {
  removeFlashcard: {
    id: string;
  };
}

export interface RemoveFlashcardVariables {
  id: string;
}

// CORREÇÃO CRÍTICA DO MVP: Alterado para $id: ID! em conformidade com NestJS/Prisma
export const REMOVE_FLASHCARD: TypedDocumentNode<RemoveFlashcardResponse, RemoveFlashcardVariables> = gql`
  mutation RemoveFlashcard($id: ID!) {
    removeFlashcard(id: $id) {
      id
    }
  }
`;