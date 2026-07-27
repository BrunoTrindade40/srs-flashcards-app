import { gql, type TypedDocumentNode } from '@apollo/client/core';
import type { Flashcard } from './flashcard';

export interface Deck {
  id: string;
  title: string;
  description?: string | null; // 🔴 CRÍTICO CORRIGIDO: Tipagem estendida para suportar null
  sourceLanguage?: string | null;
  targetLanguage?: string | null;
  isArchived?: boolean | null;
  _count?: {
    flashcards: number;
  };
  flashcards?: Flashcard[];
}

// --- QUERY: Get My Decks ---
export interface GetMyDecksResponse {
  myDecks: Deck[];
}

export const GET_MY_DECKS: TypedDocumentNode<GetMyDecksResponse, Record<string, never>> = gql`
  query GetMyDecks {
    myDecks {
      id
      title
      description
      sourceLanguage
      targetLanguage
      _count {
        flashcards
      }
    }
  }
`;

// --- QUERY: Get Deck Details ---
export interface GetDeckDetailsResponse {
  deck: Deck;
}

export interface GetDeckDetailsVariables {
  id: string;
}

export const GET_DECK_DETAILS: TypedDocumentNode<GetDeckDetailsResponse, GetDeckDetailsVariables> = gql`
  query GetDeckDetails($id: ID!) {
    deck(id: $id) {
      id
      title
      description
      sourceLanguage
      targetLanguage
      _count {
        flashcards
      }
      flashcards {
        id
        front
        back
      }
    }
  }
`;

// --- MUTATION: Create Deck ---
export interface CreateDeckResponse {
  createDeck: Deck;
}

export interface CreateDeckVariables {
  data: {
    title: string;
    description?: string | null; // 🔴 CRÍTICO CORRIGIDO
    sourceLanguage?: string | null; // 🔴 CRÍTICO CORRIGIDO
    targetLanguage?: string | null; // 🔴 CRÍTICO CORRIGIDO
  };
}

export const CREATE_DECK: TypedDocumentNode<CreateDeckResponse, CreateDeckVariables> = gql`
  mutation CreateDeck($data: CreateDeckInput!) {
    createDeck(data: $data) {
      id
      title
      description
      sourceLanguage
      targetLanguage
      _count {
        flashcards
      }
    }
  }
`;

// --- MUTATION: Update Deck ---
export interface UpdateDeckResponse {
  updateDeck: Deck;
}

export interface UpdateDeckVariables {
  data: {
    id: string;
    title?: string | null;
    description?: string | null; // 🔴 CRÍTICO CORRIGIDO
    sourceLanguage?: string | null; // 🔴 CRÍTICO CORRIGIDO
    targetLanguage?: string | null; // 🔴 CRÍTICO CORRIGIDO
    isArchived?: boolean | null;
  };
}

export const UPDATE_DECK: TypedDocumentNode<UpdateDeckResponse, UpdateDeckVariables> = gql`
  mutation UpdateDeck($data: UpdateDeckInput!) {
    updateDeck(data: $data) {
      id
      title
      description
      sourceLanguage
      targetLanguage
      isArchived
    }
  }
`;

// --- MUTATION: Delete Deck ---
export interface DeleteDeckResponse {
  removeDeck: boolean;
}

export interface DeleteDeckVariables {
  id: string;
}

export const DELETE_DECK: TypedDocumentNode<DeleteDeckResponse, DeleteDeckVariables> = gql`
  mutation DeleteDeck($id: ID!) {
    removeDeck(id: $id)
  }
`;