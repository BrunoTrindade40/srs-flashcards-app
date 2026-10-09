import React from "react";
import type { StudyHeaderProps } from "./StudyHeader.types";

export const StudyHeader: React.FC<StudyHeaderProps> = ({
  totalCards,
  onExit,
}) => (
  // UI02: Restauração da âncora off-white/branca mantendo-se estritamente ao Flexbox
  <header className="w-full bg-white border-b border-slate-200 px-4 py-3 shadow-sm shrink-0 z-40">
    <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
      {/* Elemento de Identidade Estática (Dumb Terminal Anchor) */}
      <div className="flex items-center gap-2 select-none">
        <span className="text-2xl">🧠</span>
        <span className="font-extrabold text-slate-900 text-lg hidden sm:block">
          FlashCards{" "}
          <span className="text-amber-600 text-xs font-mono font-normal">
            FSRS
          </span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="hidden sm:inline">Restam</span> {totalCards}{" "}
          <span className="hidden sm:inline">
            {totalCards === 1 ? "cartão" : "cartões"}
          </span>
        </span>
        <button
          onClick={onExit}
          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg border border-red-200 transition-colors cursor-pointer text-xs font-bold flex items-center gap-2"
        >
          <span>Encerrar</span>
          <kbd className="hidden sm:flex px-1.5 py-0.5 bg-white border border-red-200 rounded text-[9px] font-mono text-red-500 shadow-sm tracking-wider items-center justify-center">
            ESC
          </kbd>
        </button>
      </div>
    </div>
  </header>
);
