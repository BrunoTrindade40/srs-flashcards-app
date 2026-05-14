import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('As chaves VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias no .env local.');
}

// Exporta o singleton do Supabase para ser consumido pelo Apollo (e outras rotas)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);