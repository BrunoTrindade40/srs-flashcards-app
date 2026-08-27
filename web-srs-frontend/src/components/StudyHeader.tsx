import React from "react";

interface StudyHeaderProps {
  totalCards: number;
  onExit: () => void;
}

export const StudyHeader: React.FC<StudyHeaderProps> = ({ totalCards, onExit }) => (
  <div className="flex justify-between items-center w-full text-slate-400 text-sm font-semibold">
    <span className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
      Restam {totalCards} {totalCards === 1 ? "cartão" : "cartões"} na fila
    </span>
    <button
      onClick={onExit}
      className="hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-2"
    >
      <span>Encerrar Sessão</span>
      <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-[9px] font-mono text-slate-400 shadow-inner tracking-wider">
        ESC
      </kbd>
    </button>
  </div>
);