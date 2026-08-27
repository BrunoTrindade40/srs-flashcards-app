import { useApolloClient } from "@apollo/client/react";
import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { SettingsModal } from "./SettingsModal";

/**
 * SRP: Gerencia o cabeçalho global do sistema, perfil e logout.
 * UI02: Ancoragem Estática imutável em tema claro (Branco/Off-white).
 */
export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const client = useApolloClient();

  const handleLogout = async () => {
    try {
      await logout();
      await client.clearStore();
      navigate("/");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Erro ao realizar logout:", error.message);
      }
    }
  };

  // CORREÇÃO: Estabilização de referência para evitar Thrashing no EventListener do Modal
  // O useCallback garante que a função preserve a mesma identidade de memória entre os renders
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  return (
    <header className="w-full bg-white border-b border-slate-200 px-4 py-3 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 group transition-all"
        >
          <span className="text-2xl">🧠</span>
          <span className="font-extrabold text-slate-900 text-lg group-hover:text-amber-600 transition-colors">
            FlashCards{" "}
            <span className="text-amber-600 text-xs font-mono font-normal">
              FSRS
            </span>
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-3">
            <button
              disabled
              title="Funcionalidade mapeada para a Fase 2 (TCC 2)"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-lg text-xs font-bold cursor-not-allowed opacity-75"
            >
              <span>🔥 Modo Caos (Em Breve)</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5"
              title="Configurações e Limites Cognitivos"
            >
              <span>⚙️</span>
              <span className="hidden md:inline">Ajustes</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg border border-red-200 transition-colors cursor-pointer text-xs font-bold"
            >
              Sair
            </button>
          </div>
        )}
      </div>

      {/* CORREÇÃO CRÍTICA: Desmontagem Condicional Estrita (Tear-down) */}
      {/* O componente só é montado na árvore DOM quando o estado é true */}
      {isSettingsOpen && (
        <SettingsModal
          onClose={closeSettings}
        />
      )}
    </header>
  );
};