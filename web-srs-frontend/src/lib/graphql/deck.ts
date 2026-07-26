import { gql, type TypedDocumentNode } from '@apollo/client/core';

export interface Deck {
  id: string;
  title: string;
  description?: string;
  _count?: {
    flashcards: number;
  };
  // Tipagem necessária para renderizar a lista na página de detalhes
  flashcards?: {
    id: string;
    front: string;
    back: string;
  }[];
}

// --- QUERY: Get My Decks ---
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
      _count {
        flashcards
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
    description?: string;
  };
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
      _count {
        flashcards
      }
    }
  }
`;

// --- QUERY: Get Deck Details (CORRIGIDO) ---
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

// --- MUTATION: Delete Deck (ADICIONADO) ---
export interface DeleteDeckResponse {
  removeDeck: { id: string };
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