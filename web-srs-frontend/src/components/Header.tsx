import React from "react";
import { useNavigate } from "react-router-dom";
// Importação estrita do hook do Apollo v4.1.9 para acessar a instância do cliente
import { useApolloClient } from "@apollo/client/react";
import { supabase } from "../lib/supabaseClient";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const client = useApolloClient();

  const handleLogout = async () => {
    try {
      // 1. Invalida a sessão JWT no provedor de identidade (Supabase)
      await supabase.auth.signOut();

      // 2. Limpa o cache em memória do Apollo Client para evitar vazamento de dados
      await client.clearStore();

      // 3. Redireciona o usuário de volta para a tela de login
      navigate("/login");
    } catch (error) {
      console.error("Erro crítico ao encerrar a sessão:", error);
      alert(
        "Não foi possível encerrar a sessão de forma segura. Tente novamente.",
      );
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 w-full shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Identidade Visual / Navegação para a Home */}
          <button
            onClick={() => navigate("/dashboard")}
            className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity"
            aria-label="Ir para o Dashboard"
          >
            <span className="text-2xl font-extrabold text-blue-700 tracking-tight">
              SRS<span className="text-gray-800">Flash</span>
            </span>
          </button>

          {/* Área de Ações do Usuário */}
          <div className="flex items-center space-x-6">
            <span className="text-sm font-bold text-gray-600 hidden md:block">
              Área do Estudante
            </span>
            <button
              onClick={handleLogout}
              className="px-5 py-2 text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100 shadow-sm"
              aria-label="Sair da aplicação"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
