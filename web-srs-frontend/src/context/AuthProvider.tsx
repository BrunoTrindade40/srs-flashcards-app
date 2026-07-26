import type { Session, User } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  // O loading inicia como true para bloquear a renderização das rotas protegidas
  // até que o Supabase responda se existe uma sessão ativa no storage do navegador.
  const [loading, setLoading] = useState<boolean>(true);

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
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      },
    );

    // Cleanup function para evitar memory leaks caso o provider seja desmontado
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    /* React 19: Objeto AuthContext atua nativamente como Provider */
    <AuthContext value={{ session, user, loading }}>{children}</AuthContext>
  );
}
