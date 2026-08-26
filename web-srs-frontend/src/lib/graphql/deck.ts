import { graphql } from "../../gql";

export const GET_MY_DECKS = graphql(`
  query GetMyDecks {
    myDecks {
      id
      title
      description
      sourceLanguage
      targetLanguage
      isArchived
      flashcards {
        id
      }
    }
  }
`);

export const GET_DECK_DETAILS = graphql(`
  query GetDeckDetails($id: ID!) {
    deck(id: $id) {
      id
      title
      description
      sourceLanguage
      targetLanguage
      isArchived
      flashcards {
        id
        frontContent
        backContent
        sourceContext
      }
    }
  }
`);

export const CREATE_DECK = graphql(`
  mutation CreateDeck($data: CreateDeckInput!) {
    createDeck(data: $data) {
      id
      title
      description
      sourceLanguage
      targetLanguage
      isArchived
      flashcards {
        id
      }
    }
  }
`);

export const UPDATE_DECK = graphql(`
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
`);

export const DELETE_DECK = graphql(`
  mutation DeleteDeck($id: ID!) {
    removeDeck(id: $id)
  }
`);