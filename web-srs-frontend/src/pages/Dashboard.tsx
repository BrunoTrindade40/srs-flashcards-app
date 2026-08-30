import React, { useCallback } from "react";
import { CreateDeckModal } from "../components/CreateDeckModal";
import { SettingsModal } from "../components/SettingsModal";
import { DashboardStats } from "../components/DashboardStats";
import { DashboardDeckList } from "../components/DashboardDeckList";
import { useDashboard } from "../hooks/useDashboard";

export const Dashboard: React.FC = () => {
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

  const openCreateDeck = useCallback(() => setIsCreateDeckOpen(true), [setIsCreateDeckOpen]);
  const closeCreateDeck = useCallback(() => setIsCreateDeckOpen(false), [setIsCreateDeckOpen]);
  const openSettings = useCallback(() => setIsSettingsOpen(true), [setIsSettingsOpen]);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), [setIsSettingsOpen]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-4">
        <div className="text-amber-500 text-4xl animate-pulse">⚙️</div>
        <div className="text-slate-500 font-medium text-sm animate-pulse tracking-wider uppercase">
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
          {error.message || "Não foi possível sincronizar suas informações com o servidor."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto gap-8 p-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div className="flex flex-col gap-1">
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
            onClick={openSettings}
            className="flex-1 md:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            ⚙️ Configurações
          </button>
          <button
            onClick={openCreateDeck}
            className="flex-1 md:flex-none px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>+ Criar Baralho</span>
          </button>
        </div>
      </div>

      <DashboardStats
        streak={streak}
        showStreakBonus={showStreakBonus}
        activeDecksCount={activeDecks.length}
        totalActiveCards={totalActiveCards}
      />

      <DashboardDeckList
        activeDecks={activeDecks}
        archivedDecks={archivedDecks}
        onCreateDeck={openCreateDeck}
      />

      {isCreateDeckOpen && <CreateDeckModal onClose={closeCreateDeck} />}
      {isSettingsOpen && <SettingsModal onClose={closeSettings} />}
    </div>
  );
};