import React from "react";

interface StudyControlsProps {
  submitting: boolean;
  onRate: (rating: number) => void;
}

export const StudyControls: React.FC<StudyControlsProps> = ({ submitting, onRate }) => (
  <div className="flex flex-wrap md:flex-nowrap w-full gap-3 animate-fadeIn">
    <button
      disabled={submitting}
      onClick={() => onRate(1)}
      className="flex-1 py-3 bg-red-900/40 hover:bg-red-900/60 text-red-200 border border-red-800/50 font-bold rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
    >
      <span>Errei</span>
      <kbd className="px-2 py-0.5 bg-red-950/80 border border-red-800/60 rounded text-[10px] font-mono text-red-400 shadow-inner">1</kbd>
    </button>
    <button
      disabled={submitting}
      onClick={() => onRate(2)}
      className="flex-1 py-3 bg-amber-900/40 hover:bg-amber-900/60 text-amber-200 border border-amber-800/50 font-bold rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
    >
      <span>Difícil</span>
      <kbd className="px-2 py-0.5 bg-amber-950/80 border border-amber-800/60 rounded text-[10px] font-mono text-amber-400 shadow-inner">2</kbd>
    </button>
    <button
      disabled={submitting}
      onClick={() => onRate(3)}
      className="flex-1 py-3 bg-blue-900/40 hover:bg-blue-900/60 text-blue-200 border border-blue-800/50 font-bold rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
    >
      <span>Bom</span>
      <kbd className="px-2 py-0.5 bg-blue-950/80 border border-blue-800/60 rounded text-[10px] font-mono text-blue-400 shadow-inner">3</kbd>
    </button>
    <button
      disabled={submitting}
      onClick={() => onRate(4)}
      className="flex-1 py-3 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-800/50 font-bold rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
    >
      <span>Fácil</span>
      <kbd className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-800/60 rounded text-[10px] font-mono text-emerald-400 shadow-inner">4</kbd>
    </button>
  </div>
);