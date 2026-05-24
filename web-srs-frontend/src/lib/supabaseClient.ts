import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Type Guard explícito para as variáveis de ambiente
if (typeof supabaseUrl !== 'string' || typeof supabaseAnonKey !== 'string') {
  throw new Error('As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias no Frontend.');
}

// Inferência Limpa: Sem casting explícito, o ESLint não acionará o 'no-explicit-any'.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);