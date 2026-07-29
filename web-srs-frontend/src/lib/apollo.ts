import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core';
import { SetContextLink } from '@apollo/client/link/context';
import { supabase } from './supabaseClient';

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_API_URL || 'http://localhost:3000/graphql',
});

const authLink = new SetContextLink(async (_operation, prevContext) => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Falha na autorização via Supabase:', error.message);
    }
    const token = data?.session?.access_token;

    const typedContext = prevContext as { headers?: Record<string, string> };
    const currentHeaders = typedContext?.headers || {};

    return {
      headers: {
        ...currentHeaders,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Erro crítico no ciclo do interceptador de contexto:', err.message);
    }
    return { headers: {} };
  }
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          myDecks: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
          deckFlashcards: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
          dueFlashcards: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
          chaosStudyQueue: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
        },
      },
      Deck: {
        fields: {
          _count: {
            merge(existing = {}, incoming) {
              return { ...existing, ...incoming };
            },
          },
          // Resolve o warning do Cache v4 definindo que a UI confia na fonte de dados do Backend
          flashcards: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});