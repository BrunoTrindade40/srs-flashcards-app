import type { Session, User } from "@supabase/supabase-js";
import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 🟡 ALERTA e 🔵 SUGESTÃO APLICADOS (SRP e Performance):
  // Lógica de logout encapsulada no Provider e estabilizada por referência.
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Limpeza de estado local garantida após a remoção do token pelo Supabase
      setSession(null);
      setUser(null);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(
          "Falha ao invalidar a sessão no Supabase:",
          error.message,
        );
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

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

    // Inscreve a aplicação inteira para escutar mudanças de estado do Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (mounted) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setLoading(false);
        }
      },
    );

    // Cleanup function para evitar memory leaks caso o provider seja desmontado
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    /* React 19: Objeto AuthContext atua nativamente como Provider e repassa a função de logout */
    <AuthContext value={{ session, user, loading, logout }}>
      {children}
    </AuthContext>
  );
}
