import type { Session, User } from "@supabase/supabase-js";
import React, { useCallback, useEffect, useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import { supabase } from "../lib/supabaseClient";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const client = useApolloClient();

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await client.clearStore();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setUser(null);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Falha ao invalidar a sessão:", error.message);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (error) {
        // Correção: Variável de erro utilizada para manter rastreabilidade sem quebrar o linter
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        console.error(`Erro ao buscar sessão inicial: ${errorMessage}`);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (mounted) {
          // Acesso ao estado anterior (prev) evita dependência de 'session' no array
          setSession((prevSession) => {
             if (!newSession && prevSession) {
               client.clearStore().catch(() => {});
             }
             return newSession;
          });
          setUser(newSession?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [client]); // Correção: 'session' removida. Evita o loop infinito de re-inscrições.

  return (
    <AuthContext value={{ session, user, loading, logout }}>
      {children}
    </AuthContext>
  );
}