/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "\n                fragment NewDeck on Deck {\n                  id\n                  title\n                  description\n                  sourceLanguage\n                  targetLanguage\n                  _count {\n                    flashcards\n                  }\n                }\n              ": types.NewDeckFragmentDoc,
    "\n  query GetMyDecks {\n    myDecks {\n      id\n      title\n      description\n      sourceLanguage\n      targetLanguage\n      isArchived\n      _count {\n        flashcards\n      }\n    }\n  }\n": types.GetMyDecksDocument,
    "\n  query GetDeckDetails($id: ID!) {\n    deck(id: $id) {\n      id\n      title\n      description\n      sourceLanguage\n      targetLanguage\n      isArchived\n      _count {\n        flashcards\n      }\n      flashcards {\n        id\n        frontContent\n        backContent\n        sourceContext\n      }\n    }\n  }\n": types.GetDeckDetailsDocument,
    "\n  mutation CreateDeck($data: CreateDeckInput!) {\n    createDeck(data: $data) {\n      id\n      title\n      description\n      sourceLanguage\n      targetLanguage\n      isArchived\n      _count {\n        flashcards\n      }\n    }\n  }\n": types.CreateDeckDocument,
    "\n  mutation UpdateDeck($data: UpdateDeckInput!) {\n    updateDeck(data: $data) {\n      id\n      title\n      description\n      sourceLanguage\n      targetLanguage\n      isArchived\n    }\n  }\n": types.UpdateDeckDocument,
    "\n  mutation DeleteDeck($id: ID!) {\n    removeDeck(id: $id)\n  }\n": types.DeleteDeckDocument,
    "\n  mutation CreateFlashcard($data: CreateFlashcardInput!) {\n    createFlashcard(data: $data) {\n      id\n      frontContent\n      backContent\n      sourceContext\n      imageUrl\n      audioUrl\n    }\n  }\n": types.CreateFlashcardDocument,
    "\n  mutation UpdateFlashcard($data: UpdateFlashcardInput!) {\n    updateFlashcard(data: $data) {\n      id\n      frontContent\n      backContent\n      sourceContext\n      imageUrl\n      audioUrl\n    }\n  }\n": types.UpdateFlashcardDocument,
    "\n  mutation RemoveFlashcard($id: ID!) {\n    removeFlashcard(id: $id) {\n      id\n    }\n  }\n": types.RemoveFlashcardDocument,
    "\n  query GetMe {\n    me {\n      id\n      dailyNewCardLimit\n      maxDailyReviews\n      timezone\n    }\n  }\n": types.GetMeDocument,
    "\n  mutation UpdateMySettings($data: UpdateUserSettingsInput!) {\n    updateMySettings(data: $data) {\n      id\n      dailyNewCardLimit\n      maxDailyReviews\n      timezone\n    }\n  }\n": types.UpdateMySettingsDocument,
    "\n  mutation AnonymizeMe {\n    anonymizeMe\n  }\n": types.AnonymizeMeDocument,
    "\n  query GetDueFlashcards($deckId: ID!) {\n    dueFlashcards(deckId: $deckId) {\n      id\n      frontContent\n      backContent\n      sourceContext\n      \n      # Lemos apenas o 'state', que é efetivamente utilizado pelo useStudyEngine.\n      # O campo 'repetitions' foi removido por YAGNI (Over-fetching).\n      state\n    }\n  }\n": types.GetDueFlashcardsDocument,
    "\n  mutation SubmitReview(\n    $flashcardId: ID!\n    $rating: Int!\n    $reviewDurationMs: Int!\n  ) {\n    submitReview(\n      flashcardId: $flashcardId\n      rating: $rating\n      reviewDurationMs: $reviewDurationMs\n    )\n  }\n": types.SubmitReviewDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n                fragment NewDeck on Deck {\n                  id\n                  title\n                  description\n                  sourceLanguage\n                  targetLanguage\n                  _count {\n                    flashcards\n                  }\n                }\n              "): (typeof documents)["\n                fragment NewDeck on Deck {\n                  id\n                  title\n                  description\n                  sourceLanguage\n                  targetLanguage\n                  _count {\n                    flashcards\n                  }\n                }\n              "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetMyDecks {\n    myDecks {\n      id\n      title\n      description\n      sourceLanguage\n      targetLanguage\n      isArchived\n      _count {\n        flashcards\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetMyDecks {\n    myDecks {\n      id\n      title\n      description\n      sourceLanguage\n      targetLanguage\n      isArchived\n      _count {\n        flashcards\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetDeckDetails($id: ID!) {\n    deck(id: $id) {\n      id\n      title\n      description\n      sourceLanguage\n      targetLanguage\n      isArchived\n      _count {\n        flashcards\n      }\n      flashcards {\n        id\n        frontContent\n        backContent\n        sourceContext\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetDeckDetails($id: ID!) {\n    deck(id: $id) {\n      id\n      title\n      description\n      sourceLanguage\n      targetLanguage\n      isArchived\n      _count {\n        flashcards\n      }\n      flashcards {\n        id\n        frontContent\n        backContent\n        sourceContext\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateDeck($data: CreateDeckInput!) {\n    createDeck(data: $data) {\n      id\n      title\n      description\n      sourceLanguage\n      targetLanguage\n      isArchived\n      _count {\n        flashcards\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateDeck($data: CreateDeckInput!) {\n    createDeck(data: $data) {\n      id\n      title\n      description\n      sourceLanguage\n      targetLanguage\n      isArchived\n      _count {\n        flashcards\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateDeck($data: UpdateDeckInput!) {\n    updateDeck(data: $data) {\n      id\n      title\n      description\n      sourceLanguage\n      targetLanguage\n      isArchived\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateDeck($data: UpdateDeckInput!) {\n    updateDeck(data: $data) {\n      id\n      title\n      description\n      sourceLanguage\n      targetLanguage\n      isArchived\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteDeck($id: ID!) {\n    removeDeck(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteDeck($id: ID!) {\n    removeDeck(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateFlashcard($data: CreateFlashcardInput!) {\n    createFlashcard(data: $data) {\n      id\n      frontContent\n      backContent\n      sourceContext\n      imageUrl\n      audioUrl\n    }\n  }\n"): (typeof documents)["\n  mutation CreateFlashcard($data: CreateFlashcardInput!) {\n    createFlashcard(data: $data) {\n      id\n      frontContent\n      backContent\n      sourceContext\n      imageUrl\n      audioUrl\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateFlashcard($data: UpdateFlashcardInput!) {\n    updateFlashcard(data: $data) {\n      id\n      frontContent\n      backContent\n      sourceContext\n      imageUrl\n      audioUrl\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateFlashcard($data: UpdateFlashcardInput!) {\n    updateFlashcard(data: $data) {\n      id\n      frontContent\n      backContent\n      sourceContext\n      imageUrl\n      audioUrl\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveFlashcard($id: ID!) {\n    removeFlashcard(id: $id) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation RemoveFlashcard($id: ID!) {\n    removeFlashcard(id: $id) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetMe {\n    me {\n      id\n      dailyNewCardLimit\n      maxDailyReviews\n      timezone\n    }\n  }\n"): (typeof documents)["\n  query GetMe {\n    me {\n      id\n      dailyNewCardLimit\n      maxDailyReviews\n      timezone\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateMySettings($data: UpdateUserSettingsInput!) {\n    updateMySettings(data: $data) {\n      id\n      dailyNewCardLimit\n      maxDailyReviews\n      timezone\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateMySettings($data: UpdateUserSettingsInput!) {\n    updateMySettings(data: $data) {\n      id\n      dailyNewCardLimit\n      maxDailyReviews\n      timezone\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AnonymizeMe {\n    anonymizeMe\n  }\n"): (typeof documents)["\n  mutation AnonymizeMe {\n    anonymizeMe\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetDueFlashcards($deckId: ID!) {\n    dueFlashcards(deckId: $deckId) {\n      id\n      frontContent\n      backContent\n      sourceContext\n      \n      # Lemos apenas o 'state', que é efetivamente utilizado pelo useStudyEngine.\n      # O campo 'repetitions' foi removido por YAGNI (Over-fetching).\n      state\n    }\n  }\n"): (typeof documents)["\n  query GetDueFlashcards($deckId: ID!) {\n    dueFlashcards(deckId: $deckId) {\n      id\n      frontContent\n      backContent\n      sourceContext\n      \n      # Lemos apenas o 'state', que é efetivamente utilizado pelo useStudyEngine.\n      # O campo 'repetitions' foi removido por YAGNI (Over-fetching).\n      state\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SubmitReview(\n    $flashcardId: ID!\n    $rating: Int!\n    $reviewDurationMs: Int!\n  ) {\n    submitReview(\n      flashcardId: $flashcardId\n      rating: $rating\n      reviewDurationMs: $reviewDurationMs\n    )\n  }\n"): (typeof documents)["\n  mutation SubmitReview(\n    $flashcardId: ID!\n    $rating: Int!\n    $reviewDurationMs: Int!\n  ) {\n    submitReview(\n      flashcardId: $flashcardId\n      rating: $rating\n      reviewDurationMs: $reviewDurationMs\n    )\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;