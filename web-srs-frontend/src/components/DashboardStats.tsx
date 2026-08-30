import React from "react";

interface DashboardStatsProps {
  streak: number;
  showStreakBonus: boolean;
  activeDecksCount: number;
  totalActiveCards: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  streak,
  showStreakBonus,
  activeDecksCount,
  totalActiveCards,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      <div className="flex flex-col flex-1 bg-slate-900 border border-slate-800 p-5 rounded-2xl gap-2 shadow-sm hover:shadow-md transition-shadow">
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
          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded self-start mt-1">
            👏 Foco Consistente!
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 bg-slate-900 border border-slate-800 p-5 rounded-2xl gap-2 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
            Baralhos Ativos
          </span>
          <span className="text-xl">📚</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-100">
            {activeDecksCount}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            agrupamentos
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-1 bg-slate-900 border border-slate-800 p-5 rounded-2xl gap-2 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">
            Total de Flashcards
          </span>
          <span className="text-xl">🗂️</span>
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
  );
};