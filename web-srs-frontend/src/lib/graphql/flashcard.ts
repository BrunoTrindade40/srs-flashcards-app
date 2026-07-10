import { gql } from '@apollo/client';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

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