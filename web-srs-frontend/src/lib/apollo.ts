// Segregação rigorosa: Módulos de core estritamente separados dos hooks do React
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  type Reference,
  type FieldFunctionOptions
} from "@apollo/client/core";
import { SetContextLink } from "@apollo/client/link/context";
import { supabase } from "./supabaseClient";

// 1. Delegação da extração para uma Função Pura (Lazy Evaluation).
// Isso previne o colapso da thread principal no escopo do módulo e permite 
// que o React Error Boundary capture a falha durante a montagem.
const getApiUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (typeof apiUrl !== "string" || !apiUrl.trim()) {
    throw new Error(
      "A variável VITE_API_URL é obrigatória e não foi configurada no arquivo .env local. A inicialização do Apollo Client foi abortada."
    );
  }
  return apiUrl;
};

// 2. Injeção Funcional: O HttpLink suporta injeção por callback na URI.
const httpLink = new HttpLink({ uri: () => getApiUrl() });

// Tipagem 100% nativa. prevContext inferido automaticamente pelo TS.
const authLink = new SetContextLink(async (_operation, prevContext) => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Falha na autorização via Supabase:", error.message);
    }
    
    const token = data?.session?.access_token;
    
    const headers: Record<string, string> = {};

    if (
        prevContext &&
        typeof prevContext === "object" &&
        "headers" in prevContext &&
        typeof prevContext.headers === "object" &&
        prevContext.headers !== null
    ) {
        Object.entries(prevContext.headers).forEach(([key, value]) => {
            if (typeof value === "string") {
                headers[key] = value;
            }
        });
    }

    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      },
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(
        "Erro crítico no ciclo do interceptador de contexto:",
        err.message,
      );
    }
    
    const fallbackHeaders: Record<string, string> = {};
    if (
        prevContext &&
        typeof prevContext === "object" &&
        "headers" in prevContext &&
        typeof prevContext.headers === "object" &&
        prevContext.headers !== null
    ) {
        Object.entries(prevContext.headers).forEach(([key, value]) => {
            if (typeof value === "string") {
                fallbackHeaders[key] = value;
            }
        });
    }
               
    return { headers: fallbackHeaders };
  }
});

const mergeDeduplicating = (
  existing: readonly Reference[] = [],
  incoming: readonly Reference[] = [],
  { readField }: FieldFunctionOptions
): Reference[] => {
  const merged = [...existing];
  const existingIds = new Set(existing.map((ref) => readField("id", ref)));

  incoming.forEach((ref) => {
    if (!existingIds.has(readField("id", ref))) {
      merged.push(ref);
    }
  });

  return merged;
};

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          myDecks: {
            keyArgs: false,
            merge: mergeDeduplicating,
          },
          deckFlashcards: {
            keyArgs: ["deckId"],
            merge: mergeDeduplicating,
          },
          dueFlashcards: {
            keyArgs: ["deckId"],
            merge: mergeDeduplicating,
          },
          chaosStudyQueue: {
            keyArgs: false,
            merge: mergeDeduplicating,
          },
        },
      },
      Deck: {
        fields: {
          flashcards: {
            keyArgs: false,
            merge: mergeDeduplicating,
          },
          _count: {
            read(existing, { readField }) {
              const flashcardsRefs = readField("flashcards");
              
              if (Array.isArray(flashcardsRefs)) {
                return {
                  ...(existing && typeof existing === "object" ? existing : {}),
                  flashcards: flashcardsRefs.length,
                };
              }
              
              return existing;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
    },
  },
});