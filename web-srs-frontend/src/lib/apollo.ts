// Segregação rigorosa: Módulos de core estritamente separados dos hooks do React
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client/core";
import { SetContextLink } from "@apollo/client/link/context";
import { supabase } from "./supabaseClient";

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_API_URL || "http://localhost:3000/graphql",
});

// Tipagem 100% nativa. prevContext é inferido automaticamente pelo TS.
const authLink = new SetContextLink(async (_operation, prevContext) => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Falha na autorização via Supabase:", error.message);
    }

    // Segurança de Nulidade: Optional Chaining previne falhas de acesso
    const token = data?.session?.access_token;
    
    const headers: Record<string, string> = {};

    // Duck Typing com Validação Estrita de Runtime (Tolerância Zero a 'as')
    if (
        prevContext &&
        typeof prevContext === "object" &&
        "headers" in prevContext &&
        typeof prevContext.headers === "object" &&
        prevContext.headers !== null
    ) {
        // Itera sobre as chaves originais, garantindo que apenas valores 'string' 
        // sejam mapeados para o nosso Record<string, string>.
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
    // Inspeção com Type Guard, garantindo tolerância zero a 'any' na exceção
    if (err instanceof Error) {
      console.error(
        "Erro crítico no ciclo do interceptador de contexto:",
        err.message,
      );
    }
    
    // Recuperação segura do header original em caso de falha severa, mantendo a tipagem estrita
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
      fetchPolicy: "cache-and-network",
    },
  },
});