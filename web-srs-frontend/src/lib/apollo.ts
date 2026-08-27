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

// Padrão Fail-Fast para variáveis de rede
const apiUrl = import.meta.env.VITE_API_URL;
if (typeof apiUrl !== "string" || !apiUrl.trim()) {
  throw new Error(
    "A variável VITE_API_URL é obrigatória e não foi configurada. A inicialização do Apollo Client foi abortada."
  );
}

const httpLink = new HttpLink({
  uri: apiUrl,
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

/**
 * Função Pura de Deduplicação de Cache O(N)
 * Anexa novos nós de paginação de forma segura sem sobrescrever o histórico
 * ou permitir referências duplicadas (Utiliza Set para performance em buscas O(1)).
 */
const mergeDeduplicating = (
  existing: readonly Reference[] = [],
  incoming: readonly Reference[] = [],
  { readField }: FieldFunctionOptions
): Reference[] => {
  const merged = [...existing];
  // Utilização de Set nativo para mapear os IDs de forma otimizada
  const existingIds = new Set(existing.map((ref) => readField("id", ref)));

  incoming.forEach((ref) => {
    // Apenas adiciona o novo nó se seu identificador único não existir no Set
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
            keyArgs: false, // Desabilita fragmentação de cache por argumentos ($limit, $offset)
            merge: mergeDeduplicating,
          },
          deckFlashcards: {
            keyArgs: false,
            merge: mergeDeduplicating,
          },
          dueFlashcards: {
            keyArgs: false,
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