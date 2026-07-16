import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { supabase } from './supabaseClient';

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_API_URL || 'http://localhost:3000/graphql',
});

/**
 * Interceptador de Autenticação adaptado estritamente para o Apollo Client v4.1.9.
 * * NOTA ARQUITETURAL: Omitimos as tipagens explícitas nos argumentos do callback (operation, prevContext).
 * Isto permite que o compilador infira nativamente as interfaces internas da biblioteca,
 * erradicando o erro de incompatibilidade com o 'ContextSetter'.
 */
const authLink = new SetContextLink(async (_operation, prevContext) => {
  try {
    // Recupera a sessão ativa delegada ao Supabase Auth
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Falha na autorização via Supabase:', error.message);
    }

    const token = data?.session?.access_token;

    // Proteção contra o tipo 'any': mapeamos o contexto para uma estrutura estrita conhecida.
    const typedContext = prevContext as { headers?: Record<string, string> };
    const currentHeaders = typedContext?.headers || {};

    return {
      headers: {
        ...currentHeaders,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  } catch (err) {
    console.error('Erro crítico no ciclo do interceptador de contexto:', err);
    return { headers: {} };
  }
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  // CORREÇÃO: Aplicação das typePolicies para silenciar o alerta e garantir a fusão segura do agregador
  cache: new InMemoryCache({
    typePolicies: {
      Deck: {
        fields: {
          _count: {
            merge(existing, incoming) {
              // Mescla de forma segura os dados agregados antigos com a nova carga do backend
              return { ...existing, ...incoming };
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