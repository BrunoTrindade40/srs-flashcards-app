import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { client } from "../lib/apollo"; // SSOT: Instância central do Apollo importada
import { AuthContext } from "./AuthContext";

// SRP ESTRITO: O módulo exporta unicamente o Provedor lógico.
// A interface visual (Header) foi isolada fisicamente.
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Avaliação Tardia (Lazy) e síncrona do estado
    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      setSession(activeSession);
      setUser(activeSession?.user ?? null);
      setLoading(false);
    });

    // Inscrição reativa para mutações de autorização
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      setSession(activeSession);
      setUser(activeSession?.user ?? null);
      setLoading(false);
    });

    // Tear-down estrito prevenindo Stale Closures (Regra 6)
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Delegação Estrita de Destruição (Regra 44)
  const logout = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      await client.clearStore(); // Purga física e síncrona do cache GraphQL na RAM
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Falha no colapso sistêmico da sessão:", error.message);
      }
      throw error; // Transfere o controle de falha visual para a UI invocadora
    }
  }, []);

  // Memoização rigorosa para bloqueio de re-renders na árvore (Regra 42)
  const contextValue = useMemo(
    () => ({ session, user, loading, logout }),
    [session, user, loading, logout],
  );

  // Utilização nativa da API de Contexto do React 19
  return <AuthContext value={contextValue}>{children}</AuthContext>;
};
