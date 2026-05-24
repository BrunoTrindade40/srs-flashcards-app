import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { supabase } from './supabaseClient';

// Adoção estrita da classe HttpLink (Padrão Apollo v4.x)
const httpLink = new HttpLink({
  uri: import.meta.env.VITE_API_URL || 'http://localhost:3000/graphql',
});

const authLink = new SetContextLink(async (prevContext) => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Falha na autorização via Supabase:', error.message);
  }

  const token = data?.session?.access_token;
  const headers = prevContext.headers || {};

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});