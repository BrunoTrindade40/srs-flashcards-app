import { gql } from '@apollo/client';

// 1. Tipagens de Retorno e Variáveis (Zero 'any')
export interface Deck {
  id: string;
  title: string;
  description?: string;
  _count?: {
    flashcards: number;
  };
}

export interface GetMyDecksResponse {
  myDecks: Deck[];
}

// 2. Documento GraphQL
export const GET_MY_DECKS = gql`
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

// 3. Tipagens para a Criação de Decks
export interface CreateDeckResponse {
  createDeck: Deck;
}

export interface CreateDeckVariables {
  data: {
    title: string;
    description?: string;
  };
}

// 4. Documento GraphQL de Mutação
export const CREATE_DECK = gql`
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

export interface GetDeckResponse {
  deck: Deck;
}

export interface GetDeckVariables {
  id: string;
}

export const GET_DECK = gql`
  query GetDeck($id: ID!) {
    deck(id: $id) {
      id
      title
      description
      _count {
        flashcards
      }
    }
  }
`;