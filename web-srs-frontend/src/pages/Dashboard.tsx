import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CreateDeckModal } from "../components/CreateDeckModal";
import { SettingsModal } from "../components/SettingsModal";
import { useDashboard } from "../hooks/useDashboard";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // 🟢 Recebemos userName diretamente, sem precisar acessar objetos complexos na UI
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

  // Correção: Estabilização de referências (YAGNI evitado, mas KISS aplicado para performance)
  const closeCreateDeck = useCallback(() => setIsCreateDeckOpen(false), [setIsCreateDeckOpen]);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), [setIsSettingsOpen]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-4">
        <div className="text-amber-500 text-4xl animate-pulse">🧠</div>
        <div className="text-slate-400 font-medium text-sm animate-pulse tracking-wider uppercase">
          Carregando seu painel cognitivo...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] w-full gap-4 p-6 text-center">
        <span className="text-5xl">⚠️</span>
        <h2 className="text-xl font-bold text-rose-500">
          Erro ao carregar dados do Dashboard.
        </h2>
        <p className="text-sm text-slate-400 max-w-md">
          {error.message ||
            "Não foi possível sincronizar suas informações com o servidor."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto gap-8 p-6 animate-fadeIn">
      {/* Cabeçalho do Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div className="flex flex-col gap-1">
          {/* 🟢 Uso da variável higienizada */}
          <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
            <span>Olá, {userName}</span>
            <span className="text-2xl">👋</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Acompanhe o seu progresso e mantenha sua rotina de retenção ativa.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex-1 md:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl border border-slate-800 transition-all cursor-pointer flex items-center justify-center gap-2"
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

      {/* O RESTANTE DA PÁGINA PERMANECE 100% IDÊNTICO À REFATORAÇÃO ANTERIOR (100% FLEXBOX) */}

      {/* 🟢 Cards de Estatísticas estruturados exclusivamente em Flexbox (Sem Grid) */}
      <div className="flex flex-col md:flex-row gap-4 w-full">
        {/* Card de Ofensiva (Streak) */}
        <div className="flex flex-col flex-1 bg-slate-900 border border-slate-800 p-5 rounded-2xl gap-2 shadow-xl">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
              Ofensiva Atual
            </span>
            <span className="text-xl">🔥</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-100">{streak}</span>
            <span className="text-xs text-slate-400 font-medium">
              dias consecutivos
            </span>
          </div>
          {showStreakBonus && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded self-start mt-1">
              ⚡ Foco Consistente!
            </span>
          )}
        </div>

        {/* Card de Baralhos Ativos */}
        <div className="flex flex-col flex-1 bg-slate-900 border border-slate-800 p-5 rounded-2xl gap-2 shadow-xl">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
              Baralhos Ativos
            </span>
            <span className="text-xl">📚</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-100">
              {activeDecks.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              agrupamentos
            </span>
          </div>
        </div>

        {/* Card de Total de Flashcards */}
        <div className="flex flex-col flex-1 bg-slate-900 border border-slate-800 p-5 rounded-2xl gap-2 shadow-xl">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">
              Total de Flashcards
            </span>
            <span className="text-xl">🎴</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-100">
              {totalActiveCards}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              cards criados
            </span>
          </div>
        </div>
      </div>

      {/* Listagem de Baralhos Ativos */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-200">Seus Baralhos</h2>
        </div>

        {activeDecks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 border border-slate-800/80 rounded-2xl text-center gap-4">
            <span className="text-4xl">📭</span>
            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="text-base font-bold text-slate-300">
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
              const cardCount =
                deck.flashcards?.length ?? deck._count?.flashcards ?? 0;
              return (
                <div
                  key={deck.id}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-5 rounded-2xl gap-4 hover:border-slate-700 transition-all shadow-md"
                >
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-100">
                        {deck.title}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                        {cardCount} {cardCount === 1 ? "card" : "cards"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {deck.description || "Sem descrição informada."}
                    </p>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto justify-end">
                    <button
                      onClick={() => navigate(`/deck/${deck.id}`)}
                      className="flex-1 md:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
                    >
                      Ver Detalhes
                    </button>
                    <button
                      onClick={() => navigate(`/study/${deck.id}`)}
                      disabled={cardCount === 0}
                      className="flex-1 md:flex-none px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Estudar ⚡
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
        <div className="flex flex-col gap-3 pt-4 border-t border-slate-800/80">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Baralhos Arquivados ({archivedDecks.length})
          </h3>
          <div className="flex flex-col gap-2">
            {archivedDecks.map((deck) => (
              <div
                key={deck.id}
                className="flex justify-between items-center bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl gap-4"
              >
                <span className="text-sm font-semibold text-slate-400">
                  {deck.title}
                </span>
                <button
                  onClick={() => navigate(`/deck/${deck.id}`)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg border border-slate-700 transition-all cursor-pointer"
                >
                  Gerenciar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Renderização condicional dos Modais */}
      <CreateDeckModal
        isOpen={isCreateDeckOpen}
        onClose={closeCreateDeck} // Agora a referência é estável
      />
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings} // Agora a referência é estável
      />
    </div>
  );
};
