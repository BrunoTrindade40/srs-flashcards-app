import { graphql } from "../../gql";

export const CREATE_FLASHCARD = graphql(`
  mutation CreateFlashcard($data: CreateFlashcardInput!) {
    createFlashcard(data: $data) {
      id
      frontContent
      backContent
      sourceContext
      imageUrl
      audioUrl
    }
  }
`);

export const UPDATE_FLASHCARD = graphql(`
  mutation UpdateFlashcard($data: UpdateFlashcardInput!) {
    updateFlashcard(data: $data) {
      id
      frontContent
      backContent
      sourceContext
      imageUrl
      audioUrl
    }
  }
`);

// CORREÇÃO: Restaurada a sintaxe correta e a seleção de subcampo '{ id }' exigida pelo Backend
export const REMOVE_FLASHCARD = graphql(`
  mutation RemoveFlashcard($id: ID!) {
    removeFlashcard(id: $id) {
      id
    }
  }
`);