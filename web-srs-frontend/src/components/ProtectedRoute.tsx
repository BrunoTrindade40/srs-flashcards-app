import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
// Importação estrita de tipo do Supabase para evitar o tipo 'any'
import type { Session } from "@supabase/supabase-js";

export const ProtectedRoute: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Busca a sessão inicial de forma atômica
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoading(false);
    });

    // Inscreve um escutador para capturar mudanças de estado (Login/Logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-lg font-bold text-gray-700">
          Verificando autenticação...
        </p>
      </div>
    );
  }

  // Se não houver sessão ativa, redireciona estritamente para o Login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Se autenticado, renderiza as rotas filhas declaradas no roteador
  return <Outlet />;
};
