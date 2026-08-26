import React from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";

/**
 * SRP: Intercepta rotas dinâmicas que exigem um identificador de baralho (deckId).
 * Aplica o Padrão Bouncer para abortar a montagem de telas pesadas em caso de URL malformada.
 */
export const RequireDeckParam: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();

  // 1. Padrão Bouncer: Rejeita parâmetros nulos, indefinidos ou vazios antes do render dos filhos
  if (!deckId || !deckId.trim()) {
    return <Navigate to="/dashboard" replace />;
  }

  // 2. Renderização transparente dos componentes aninhados via Outlet
  return <Outlet />;
};