import { useApolloClient } from "@apollo/client/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { supabase } from "../lib/supabaseClient";
import { SettingsModal } from "./SettingsModal";

export function Header() {
  const navigate = useNavigate();
  const client = useApolloClient(); // Instância oficial do Apollo Client v4.x
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      // 1. LIMPEZA DE SEGURANÇA: Exclui todo o cache do Apollo para evitar vazamento entre contas
      await client.clearStore();

      // 2. AUTENTICAÇÃO: Encerra a sessão ativa no Supabase Auth
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      showToast("Sessão encerrada com sucesso.", "info");
      navigate("/login", { replace: true });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Erro ao realizar logout:", error.message);
        showToast(`Erro ao encerrar sessão: ${error.message}`, "error");
      } else {
        console.error("Erro desconhecido ao realizar logout:", error);
        showToast("Erro inesperado ao encerrar a sessão.", "error");
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo e Branding */}
        <div className="flex items-center gap-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-amber-400 font-bold text-lg hover:opacity-90 transition-opacity"
          >
            <span className="text-xl">⚡</span>
            <span className="tracking-tight text-slate-100">
              SRS Flashcards
            </span>
          </Link>

          {/* Navegação Principal */}
          <nav className="hidden sm:flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-amber-400 transition-colors py-1 px-2 rounded-md hover:bg-slate-800/60"
            >
              Dashboard
            </Link>
            <Link
              to="/chaos"
              className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 hover:text-amber-300 transition-colors py-1 px-2 rounded-md bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20"
            >
              Modo Chaos ⚡
            </Link>
          </nav>
        </div>

        {/* Informações do Usuário e Ações */}
        <div className="flex items-center gap-3">
          {user?.email && (
            <span className="hidden md:inline-block text-xs font-medium text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              {user.email}
            </span>
          )}

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Configurações de Estudo"
            aria-label="Abrir Configurações"
          >
            ⚙️
          </button>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 text-slate-300 font-medium text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoggingOut ? "Saindo..." : "Sair"}
          </button>
        </div>
      </div>

      {/* Modal de Configurações */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </header>
  );
}

export default Header;
