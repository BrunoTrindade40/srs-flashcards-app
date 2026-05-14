import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { supabase } from './supabaseClient';

const httpLink = new HttpLink({
  uri: 'http://localhost:3000/graphql',
});

// A classe SetContextLink é instanciada nativamente.
// O prevContext é posicionado como o primeiro argumento.
const authLink = new SetContextLink(async (prevContext) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return {
    headers: {
      ...prevContext.headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});