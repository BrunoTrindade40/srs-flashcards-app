import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CreateDeckModal } from "../components/CreateDeckModal";
import { SettingsModal } from "../components/SettingsModal";
import { useDashboard } from "../hooks/useDashboard";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const {
    userName,
    activeDecks,
    archivedDecks,
    totalActiveCards,
    streak,
    showStreakBonus,
    loading,
    error,
    isCreateDeckOpen,
    setIsCreateDeckOpen,
    isSettingsOpen,
    setIsSettingsOpen,
  } = useDashboard();

  // Preservação do SRP para lidar com o controle local do render.
  const closeCreateDeck = useCallback(() => setIsCreateDeckOpen(false), [setIsCreateDeckOpen]);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), [setIsSettingsOpen]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-4">
        <div className="text-amber-500 text-4xl animate-pulse">⚡</div>
        <div className="text-slate-600 font-medium text-sm animate-pulse tracking-wider uppercase">
          Carregando seu painel cognitivo...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] w-full gap-4 p-6 text-center">
        <span className="text-5xl">🛑</span>
        <h2 className="text-xl font-bold text-rose-600">
          Erro ao carregar dados do Dashboard.
        </h2>
        <p className="text-sm text-slate-500 max-w-md">
          {error.message ||
            "Não foi possível sincronizar suas informações com o servidor."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto gap-8 p-6 animate-fadeIn">
      {/* Cabeçalho do Dashboard adaptado ao Light Mode */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <span>Olá, {userName}</span>
            <span className="text-2xl">👋</span>
          </h1>
          <p className="text-slate-500 text-sm">
            Acompanhe o seu progresso e mantenha sua rotina de retenção ativa.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex-1 md:flex-none px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            ⚙️ Configurações
          </button>
          <button
            onClick={() => setIsCreateDeckOpen(true)}
            className="flex-1 md:flex-none px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>+ Criar Baralho</span>
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas em Flexbox - Readequação para Light/Off-White */}
      <div className="flex flex-col md:flex-row gap-4 w-full">
        {/* Card de Ofensiva (Streak) */}
        <div className="flex flex-col flex-1 bg-white border border-slate-200 p-5 rounded-2xl gap-2 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Ofensiva Atual
            </span>
            <span className="text-xl">🔥</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">{streak}</span>
            <span className="text-xs text-slate-500 font-medium">
              dias consecutivos
            </span>
          </div>
          {showStreakBonus && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded self-start mt-1">
              ✨ Foco Consistente!
            </span>
          )}
        </div>

        {/* Card de Baralhos Ativos */}
        <div className="flex flex-col flex-1 bg-white border border-slate-200 p-5 rounded-2xl gap-2 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Baralhos Ativos
            </span>
            <span className="text-xl">📚</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">
              {activeDecks.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              agrupamentos
            </span>
          </div>
        </div>

        {/* Card de Total de Flashcards */}
        <div className="flex flex-col flex-1 bg-white border border-slate-200 p-5 rounded-2xl gap-2 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Total de Flashcards
            </span>
            <span className="text-xl">🗂️</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">
              {totalActiveCards}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              cards criados
            </span>
          </div>
        </div>
      </div>

      {/* Listagem de Baralhos Ativos */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Seus Baralhos</h2>
        </div>

        {activeDecks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white/50 border border-slate-200 rounded-2xl text-center gap-4">
            <span className="text-4xl">📭</span>
            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="text-base font-bold text-slate-700">
                Nenhum baralho ativo encontrado
              </h3>
              <p className="text-xs text-slate-500">
                Crie seu primeiro baralho temático para começar a adicionar
                flashcards e iniciar suas sessões de estudo.
              </p>
            </div>
            <button
              onClick={() => setIsCreateDeckOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer mt-2"
            >
              + Criar Primeiro Baralho
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeDecks.map((deck) => {
              // Null-safety preservado, em conformidade estrita com o AST
              const cardCount = deck._count?.flashcards ?? 0;
              return (
                <div
                  key={deck.id}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-slate-200 p-5 rounded-2xl gap-4 hover:border-slate-300 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-800">
                        {deck.title}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-full">
                        {cardCount} {cardCount === 1 ? "card" : "cards"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {deck.description || "Sem descrição informada."}
                    </p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto justify-end">
                    <button
                      onClick={() => navigate(`/deck/${deck.id}`)}
                      className="flex-1 md:flex-none px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer shadow-sm"
                    >
                      Ver Detalhes
                    </button>
                    <button
                      onClick={() => navigate(`/study/${deck.id}`)}
                      disabled={cardCount === 0}
                      className="flex-1 md:flex-none px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Estudar ▶
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Baralhos Arquivados (se houver) */}
      {archivedDecks.length > 0 && (
        <div className="flex flex-col gap-3 pt-4 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Baralhos Arquivados ({archivedDecks.length})
          </h3>
          <div className="flex flex-col gap-2">
            {archivedDecks.map((deck) => (
              <div
                key={deck.id}
                className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-xl gap-4"
              >
                <span className="text-sm font-semibold text-slate-600">
                  {deck.title}
                </span>
                <button
                  onClick={() => navigate(`/deck/${deck.id}`)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 transition-all cursor-pointer shadow-sm"
                >
                  Gerenciar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isCreateDeckOpen && (
        <CreateDeckModal
          isOpen={isCreateDeckOpen}
          onClose={closeCreateDeck}
        />
      )}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={closeSettings}
        />
      )}
    </div>
  );
};