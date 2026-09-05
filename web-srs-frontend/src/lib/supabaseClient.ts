import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// -----------------------------------------------------------------------------
// Adaptador de Storage Defensivo O(1)
// -----------------------------------------------------------------------------
const memoryStorage = new Map<string, string>();
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      memoryStorage.set(key, value);
    }
  },
  removeItem: (key: string): void => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      memoryStorage.delete(key);
    }
  },
};

// Singleton para garantir O(1) na instanciação cruzada de subcomponentes
let supabaseInstance: SupabaseClient | null = null;

// -----------------------------------------------------------------------------
// Avaliação Tardia (Lazy Evaluation)
// -----------------------------------------------------------------------------
const getSupabaseClient = (): SupabaseClient => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (typeof supabaseUrl !== "string" || typeof supabaseAnonKey !== "string") {
    throw new Error(
      "As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias no Frontend.",
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: safeStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseInstance;
};

// -----------------------------------------------------------------------------
// Padrão Inversão de Proxy (Zero Refactoring Overhead)
// -----------------------------------------------------------------------------
// Alvo estrutural inerte (Duck Typing) para pacificar o compilador.
const inertDummyTarget = createClient(
  "https://placeholder.supabase.co",
  "placeholder",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);

export const supabase = new Proxy(inertDummyTarget, {
  get(_, prop: keyof SupabaseClient) {
    const client = getSupabaseClient();
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
