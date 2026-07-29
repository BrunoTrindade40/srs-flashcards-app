import { useApolloClient } from "@apollo/client/react";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { SettingsModal } from "./SettingsModal";

/**
 * SRP: Gerencia o cabeçalho global do sistema, perfil e logout.
 * Reduzido propositalmente: a navegação de retorno foi movida para as páginas específicas.
 */
export const Header: React.FC = () => {
  // Consumindo 'logout' e 'user' estritamente como definidos no seu AuthContext.ts
  const { user, logout } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navigate = useNavigate();
  const client = useApolloClient();

  // Handler robusto para o Logout
  const handleLogout = async () => {
    try {
      // 1. Evita a injeção do MouseEvent (falha silenciosa do Supabase)
      await logout();

      // 2. Purga a memória RAM do Apollo (Isolamento de Tenant / Segurança)
      await client.clearStore();

      // 3. Força o redirecionamento para fora da área logada
      navigate("/");
    } catch (error) {
      console.error("Erro ao realizar logout:", error);
    }
  };

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 px-4 py-3 shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Identidade do Sistema */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 group transition-all"
        >
          <span className="text-2xl">🧠</span>
          <span className="font-extrabold text-slate-100 text-lg group-hover:text-amber-400 transition-colors">
            FlashCards{" "}
            <span className="text-amber-500 text-xs font-mono font-normal">
              FSRS
            </span>
          </span>
        </Link>

        {/* Ações do Usuário */}
        {user && (
          <div className="flex items-center gap-3">
            {/* FASE 2 DESABILITADA: Proteção de Escopo do MVP */}
            <button
              disabled
              title="Funcionalidade mapeada para a Fase 2 (TCC 2)"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/40 text-slate-500 border border-slate-800/80 rounded-lg text-xs font-bold cursor-not-allowed opacity-75"
            >
              <span>⚡ Modo Caos (Em Breve)</span>
            </button>

            {/* Ajustes do Perfil */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5"
              title="Configurações e Limites Cognitivos"
            >
              <span>⚙️</span>
              <span className="hidden md:inline">Ajustes</span>
            </button>

            {/* Logout Estrito */}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 rounded-lg border border-red-900/40 transition-colors cursor-pointer text-xs font-bold"
            >
              Sair
            </button>
          </div>
        )}
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </header>
  );
};
