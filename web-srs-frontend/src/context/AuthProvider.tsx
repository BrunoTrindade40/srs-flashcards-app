import type { Session, User } from "@supabase/supabase-js";
import React, { useCallback, useEffect, useState } from "react";
// 🟢 REGRA APLICADA: Importação estrita do Hook, substituindo o acoplamento estático
import { useApolloClient } from "@apollo/client/react";
import { supabase } from "../lib/supabaseClient";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 🟢 REGRA APLICADA: Obtemos o client ativo injetado na árvore do React
  const client = useApolloClient();

  const logout = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Expurgar obrigatoriamente a memória RAM do Apollo Cache
      await client.clearStore();

      // 2. Encerrar a sessão no provedor de identidade (Supabase)
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // 3. Zerar estados locais do React
      setSession(null);
      setUser(null);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(
          "Falha ao invalidar a sessão no Supabase e expurgar cache:",
          error.message,
        );
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [client]); // O useCallback agora rastreia o 'client' como dependência estável

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
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("Erro ao buscar sessão inicial:", error.message);
        } else {
          console.error("Erro desconhecido ao buscar sessão inicial.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (mounted) {
          if (!newSession && session) {
            // Expurgar memória caso o token expire passivamente
            await client.clearStore().catch(() => {});
          }
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setLoading(false);
        }
      },
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [session, client]); // O useEffect também recebe o 'client' como dependência

  return (
    <AuthContext value={{ session, user, loading, logout }}>
      {children}
    </AuthContext>
  );
}
