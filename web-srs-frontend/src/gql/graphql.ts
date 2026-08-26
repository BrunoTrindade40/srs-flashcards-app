/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: any; output: any; }
};

export type CreateDeckInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  sourceLanguage?: InputMaybe<Scalars['String']['input']>;
  targetLanguage?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type CreateFlashcardInput = {
  aiModelSource?: InputMaybe<Scalars['String']['input']>;
  audioUrl?: InputMaybe<Scalars['String']['input']>;
  backContent: Scalars['String']['input'];
  deckId: Scalars['String']['input'];
  frontContent: Scalars['String']['input'];
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  isEditedAfterAi?: InputMaybe<Scalars['Boolean']['input']>;
  sourceContext?: InputMaybe<Scalars['String']['input']>;
};

/** Modelo principal do baralho de estudos */
export type Deck = {
  __typename?: 'Deck';
  _count?: Maybe<DeckCount>;
  /** Timestamp de criação do registo */
  createdAt: Scalars['DateTime']['output'];
  /** Vínculo com o identificador único do utilizador criador */
  creatorId: Scalars['ID']['output'];
  /** Descrição opcional do propósito do baralho */
  description?: Maybe<Scalars['String']['output']>;
  /** Lista de flashcards pertencentes a este baralho */
  flashcards?: Maybe<Array<Flashcard>>;
  /** Identificador único do baralho (UUID) */
  id: Scalars['ID']['output'];
  /** Sinalizador de arquivamento lógico do baralho */
  isArchived: Scalars['Boolean']['output'];
  /** Idioma de origem do conteúdo */
  sourceLanguage?: Maybe<Scalars['String']['output']>;
  /** Idioma alvo do aprendizado */
  targetLanguage?: Maybe<Scalars['String']['output']>;
  /** Título identificador do baralho */
  title: Scalars['String']['output'];
  /** Timestamp da última modificação do registo */
  updatedAt: Scalars['DateTime']['output'];
};

/** Agregador de contagem de relações do baralho */
export type DeckCount = {
  __typename?: 'DeckCount';
  /** Quantidade total de flashcards associados a este baralho */
  flashcards: Scalars['Int']['output'];
};

export type Flashcard = {
  __typename?: 'Flashcard';
  aiModelSource?: Maybe<Scalars['String']['output']>;
  audioUrl?: Maybe<Scalars['String']['output']>;
  backContent: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  deckId: Scalars['String']['output'];
  /** Data agendada pelo FSRS */
  due?: Maybe<Scalars['DateTime']['output']>;
  frontContent: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  isEditedAfterAi: Scalars['Boolean']['output'];
  isPublished: Scalars['Boolean']['output'];
  sourceContext?: Maybe<Scalars['String']['output']>;
  /** 0=NEW, 1=LEARN, 2=REVIEW, 3=RELEARN */
  state?: Maybe<Scalars['Int']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  anonymizeMe: Scalars['Boolean']['output'];
  createDeck: Deck;
  createFlashcard: Flashcard;
  enrollInDeck: Scalars['Boolean']['output'];
  removeDeck: Scalars['Boolean']['output'];
  removeFlashcard: Flashcard;
  submitReview: Scalars['Boolean']['output'];
  toggleDeckArchive: Deck;
  unenrollFromDeck: Scalars['Boolean']['output'];
  updateDeck: Deck;
  updateFlashcard: Flashcard;
  updateMySettings: User;
};


export type MutationCreateDeckArgs = {
  data: CreateDeckInput;
};


export type MutationCreateFlashcardArgs = {
  data: CreateFlashcardInput;
};


export type MutationEnrollInDeckArgs = {
  deckId: Scalars['ID']['input'];
};


export type MutationRemoveDeckArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveFlashcardArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSubmitReviewArgs = {
  flashcardId: Scalars['ID']['input'];
  rating: Scalars['Int']['input'];
  reviewDurationMs?: Scalars['Int']['input'];
};


export type MutationToggleDeckArchiveArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUnenrollFromDeckArgs = {
  deckId: Scalars['ID']['input'];
};


export type MutationUpdateDeckArgs = {
  data: UpdateDeckInput;
};


export type MutationUpdateFlashcardArgs = {
  data: UpdateFlashcardInput;
};


export type MutationUpdateMySettingsArgs = {
  data: UpdateUserSettingsInput;
};

export type Query = {
  __typename?: 'Query';
  chaosStudyQueue: Array<Flashcard>;
  deck: Deck;
  deckFlashcards: Array<Flashcard>;
  dueFlashcards: Array<Flashcard>;
  me: User;
  myDecks: Array<Deck>;
};


export type QueryChaosStudyQueueArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryDeckArgs = {
  id: Scalars['ID']['input'];
};


export type QueryDeckFlashcardsArgs = {
  deckId: Scalars['ID']['input'];
};


export type QueryDueFlashcardsArgs = {
  deckId: Scalars['ID']['input'];
};

export type UpdateDeckInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  /** ID do baralho que sofrerá a mutação */
  id: Scalars['ID']['input'];
  isArchived?: InputMaybe<Scalars['Boolean']['input']>;
  sourceLanguage?: InputMaybe<Scalars['String']['input']>;
  targetLanguage?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateFlashcardInput = {
  aiModelSource?: InputMaybe<Scalars['String']['input']>;
  audioUrl?: InputMaybe<Scalars['String']['input']>;
  backContent?: InputMaybe<Scalars['String']['input']>;
  deckId?: InputMaybe<Scalars['String']['input']>;
  frontContent?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  isEditedAfterAi?: InputMaybe<Scalars['Boolean']['input']>;
  resetProgress?: InputMaybe<Scalars['Boolean']['input']>;
  sourceContext?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserSettingsInput = {
  dailyNewCardLimit?: InputMaybe<Scalars['Int']['input']>;
  dailyRolloverTime?: InputMaybe<Scalars['String']['input']>;
  maxDailyReviews?: InputMaybe<Scalars['Int']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['DateTime']['output'];
  currentStreak: Scalars['Int']['output'];
  dailyNewCardLimit: Scalars['Int']['output'];
  dailyRolloverTime?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isAnonymized: Scalars['Boolean']['output'];
  lastDataExportAt?: Maybe<Scalars['DateTime']['output']>;
  lastNotificationSentAt?: Maybe<Scalars['DateTime']['output']>;
  longestStreak: Scalars['Int']['output'];
  maxDailyReviews: Scalars['Int']['output'];
  name?: Maybe<Scalars['String']['output']>;
  timezone: Scalars['String']['output'];
  totalXp: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type GetMyDecksQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyDecksQuery = { __typename?: 'Query', myDecks: Array<{ __typename?: 'Deck', id: string, title: string, description?: string | null, sourceLanguage?: string | null, targetLanguage?: string | null, isArchived: boolean, flashcards?: Array<{ __typename?: 'Flashcard', id: string }> | null }> };

export type GetDeckDetailsQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetDeckDetailsQuery = { __typename?: 'Query', deck: { __typename?: 'Deck', id: string, title: string, description?: string | null, sourceLanguage?: string | null, targetLanguage?: string | null, isArchived: boolean, flashcards?: Array<{ __typename?: 'Flashcard', id: string, frontContent: string, backContent: string, sourceContext?: string | null }> | null } };

export type CreateDeckMutationVariables = Exact<{
  data: CreateDeckInput;
}>;


export type CreateDeckMutation = { __typename?: 'Mutation', createDeck: { __typename?: 'Deck', id: string, title: string, description?: string | null, sourceLanguage?: string | null, targetLanguage?: string | null, isArchived: boolean, flashcards?: Array<{ __typename?: 'Flashcard', id: string }> | null } };

export type UpdateDeckMutationVariables = Exact<{
  data: UpdateDeckInput;
}>;


export type UpdateDeckMutation = { __typename?: 'Mutation', updateDeck: { __typename?: 'Deck', id: string, title: string, description?: string | null, sourceLanguage?: string | null, targetLanguage?: string | null, isArchived: boolean } };

export type DeleteDeckMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteDeckMutation = { __typename?: 'Mutation', removeDeck: boolean };

export type CreateFlashcardMutationVariables = Exact<{
  data: CreateFlashcardInput;
}>;


export type CreateFlashcardMutation = { __typename?: 'Mutation', createFlashcard: { __typename?: 'Flashcard', id: string, frontContent: string, backContent: string, sourceContext?: string | null, imageUrl?: string | null, audioUrl?: string | null } };

export type UpdateFlashcardMutationVariables = Exact<{
  data: UpdateFlashcardInput;
}>;


export type UpdateFlashcardMutation = { __typename?: 'Mutation', updateFlashcard: { __typename?: 'Flashcard', id: string, frontContent: string, backContent: string, sourceContext?: string | null, imageUrl?: string | null, audioUrl?: string | null } };

export type RemoveFlashcardMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RemoveFlashcardMutation = { __typename?: 'Mutation', removeFlashcard: { __typename?: 'Flashcard', id: string } };

export type GetMeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeQuery = { __typename?: 'Query', me: { __typename?: 'User', id: string, name?: string | null, currentStreak: number, dailyNewCardLimit: number, maxDailyReviews: number, timezone: string, dailyRolloverTime?: string | null } };

export type UpdateMySettingsMutationVariables = Exact<{
  data: UpdateUserSettingsInput;
}>;


export type UpdateMySettingsMutation = { __typename?: 'Mutation', updateMySettings: { __typename?: 'User', id: string, dailyNewCardLimit: number, maxDailyReviews: number, timezone: string, dailyRolloverTime?: string | null } };

export type AnonymizeMeMutationVariables = Exact<{ [key: string]: never; }>;


export type AnonymizeMeMutation = { __typename?: 'Mutation', anonymizeMe: boolean };

export type GetDueFlashcardsQueryVariables = Exact<{
  deckId: Scalars['ID']['input'];
}>;


export type GetDueFlashcardsQuery = { __typename?: 'Query', dueFlashcards: Array<{ __typename?: 'Flashcard', id: string, frontContent: string, backContent: string, sourceContext?: string | null, due?: any | null }> };

export type SubmitReviewMutationVariables = Exact<{
  flashcardId: Scalars['ID']['input'];
  rating: Scalars['Int']['input'];
  reviewDurationMs: Scalars['Int']['input'];
}>;


export type SubmitReviewMutation = { __typename?: 'Mutation', submitReview: boolean };


export const GetMyDecksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyDecks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myDecks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sourceLanguage"}},{"kind":"Field","name":{"kind":"Name","value":"targetLanguage"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"flashcards"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<GetMyDecksQuery, GetMyDecksQueryVariables>;
export const GetDeckDetailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDeckDetails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deck"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sourceLanguage"}},{"kind":"Field","name":{"kind":"Name","value":"targetLanguage"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"flashcards"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"frontContent"}},{"kind":"Field","name":{"kind":"Name","value":"backContent"}},{"kind":"Field","name":{"kind":"Name","value":"sourceContext"}}]}}]}}]}}]} as unknown as DocumentNode<GetDeckDetailsQuery, GetDeckDetailsQueryVariables>;
export const CreateDeckDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateDeck"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateDeckInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createDeck"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sourceLanguage"}},{"kind":"Field","name":{"kind":"Name","value":"targetLanguage"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"flashcards"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<CreateDeckMutation, CreateDeckMutationVariables>;
export const UpdateDeckDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDeck"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDeckInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDeck"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sourceLanguage"}},{"kind":"Field","name":{"kind":"Name","value":"targetLanguage"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}}]}}]}}]} as unknown as DocumentNode<UpdateDeckMutation, UpdateDeckMutationVariables>;
export const DeleteDeckDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteDeck"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeDeck"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteDeckMutation, DeleteDeckMutationVariables>;
export const CreateFlashcardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateFlashcard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateFlashcardInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createFlashcard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"frontContent"}},{"kind":"Field","name":{"kind":"Name","value":"backContent"}},{"kind":"Field","name":{"kind":"Name","value":"sourceContext"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"audioUrl"}}]}}]}}]} as unknown as DocumentNode<CreateFlashcardMutation, CreateFlashcardMutationVariables>;
export const UpdateFlashcardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateFlashcard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateFlashcardInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFlashcard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"frontContent"}},{"kind":"Field","name":{"kind":"Name","value":"backContent"}},{"kind":"Field","name":{"kind":"Name","value":"sourceContext"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"audioUrl"}}]}}]}}]} as unknown as DocumentNode<UpdateFlashcardMutation, UpdateFlashcardMutationVariables>;
export const RemoveFlashcardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveFlashcard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeFlashcard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<RemoveFlashcardMutation, RemoveFlashcardMutationVariables>;
export const GetMeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMe"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"currentStreak"}},{"kind":"Field","name":{"kind":"Name","value":"dailyNewCardLimit"}},{"kind":"Field","name":{"kind":"Name","value":"maxDailyReviews"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"dailyRolloverTime"}}]}}]}}]} as unknown as DocumentNode<GetMeQuery, GetMeQueryVariables>;
export const UpdateMySettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateMySettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserSettingsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMySettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"dailyNewCardLimit"}},{"kind":"Field","name":{"kind":"Name","value":"maxDailyReviews"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"dailyRolloverTime"}}]}}]}}]} as unknown as DocumentNode<UpdateMySettingsMutation, UpdateMySettingsMutationVariables>;
export const AnonymizeMeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AnonymizeMe"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"anonymizeMe"}}]}}]} as unknown as DocumentNode<AnonymizeMeMutation, AnonymizeMeMutationVariables>;
export const GetDueFlashcardsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDueFlashcards"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deckId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dueFlashcards"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"deckId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deckId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"frontContent"}},{"kind":"Field","name":{"kind":"Name","value":"backContent"}},{"kind":"Field","name":{"kind":"Name","value":"sourceContext"}},{"kind":"Field","name":{"kind":"Name","value":"due"}}]}}]}}]} as unknown as DocumentNode<GetDueFlashcardsQuery, GetDueFlashcardsQueryVariables>;
export const SubmitReviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitReview"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"flashcardId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rating"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reviewDurationMs"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitReview"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"flashcardId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"flashcardId"}}},{"kind":"Argument","name":{"kind":"Name","value":"rating"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rating"}}},{"kind":"Argument","name":{"kind":"Name","value":"reviewDurationMs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reviewDurationMs"}}}]}]}}]} as unknown as DocumentNode<SubmitReviewMutation, SubmitReviewMutationVariables>;