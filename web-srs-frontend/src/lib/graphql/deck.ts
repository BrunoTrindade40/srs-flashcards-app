import { gql, type TypedDocumentNode } from "@apollo/client/core";
import type { Flashcard } from "./flashcard";

export interface Deck {
  id: string;
  title: string;
  description?: string | null;
  sourceLanguage?: string | null;
  targetLanguage?: string | null;
  isArchived?: boolean | null;
  _count?: {
    flashcards: number;
  };
  flashcards?: Flashcard[];
}

export interface GetMyDecksResponse {
  myDecks: Deck[];
}

export const GET_MY_DECKS: TypedDocumentNode<
  GetMyDecksResponse,
  Record<string, never>
> = gql`
  query GetMyDecks {
    myDecks {
      id
      title
      description
      sourceLanguage
      targetLanguage
      isArchived
      _count {
        flashcards
      }
    }
  }
`;

export interface GetDeckDetailsResponse {
  deck: Deck;
}

export interface GetDeckDetailsVariables {
  id: string;
}

export const GET_DECK_DETAILS: TypedDocumentNode<
  GetDeckDetailsResponse,
  GetDeckDetailsVariables
> = gql`
  query GetDeckDetails($id: ID!) {
    deck(id: $id) {
      id
      title
      description
      sourceLanguage
      targetLanguage
      isArchived
      _count {
        flashcards
      }
      flashcards {
        id
        front
        back
        sourceContext
      }
    }
  }
`;

export interface CreateDeckInput {
  title: string;
  description?: string | null;
  sourceLanguage?: string | null;
  targetLanguage?: string | null;
}

export interface CreateDeckResponse {
  createDeck: Deck;
}

export interface CreateDeckVariables {
  data: CreateDeckInput;
}

export const CREATE_DECK: TypedDocumentNode<
  CreateDeckResponse,
  CreateDeckVariables
> = gql`
  mutation CreateDeck($data: CreateDeckInput!) {
    createDeck(data: $data) {
      id
      title
      description
      sourceLanguage
      targetLanguage
      isArchived
      _count {
        flashcards
      }
    }
  }
`;

export interface UpdateDeckInput {
  id: string;
  title?: string;
  description?: string | null;
  sourceLanguage?: string | null;
  targetLanguage?: string | null;
  isArchived?: boolean | null;
}

export interface UpdateDeckResponse {
  updateDeck: Deck;
}

export interface UpdateDeckVariables {
  data: UpdateDeckInput;
}

export const UPDATE_DECK: TypedDocumentNode<
  UpdateDeckResponse,
  UpdateDeckVariables
> = gql`
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

export interface DeleteDeckResponse {
  removeDeck: {
    id: string;
  };
}

export interface DeleteDeckVariables {
  id: string;
}

export const DELETE_DECK: TypedDocumentNode<
  DeleteDeckResponse,
  DeleteDeckVariables
> = gql`
  mutation DeleteDeck($id: ID!) {
    removeDeck(id: $id) {
      id
    }
  }
`;