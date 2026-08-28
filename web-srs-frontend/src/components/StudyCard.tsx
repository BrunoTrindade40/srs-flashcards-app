import React from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface StudyCardProps {
  frontContent: string;
  backContent?: string | null;
  sourceContext?: string | null;
  isFlipped: boolean;
  onShowAnswer: () => void;
}

export const StudyCard: React.FC<StudyCardProps> = ({
  frontContent,
  backContent,
  sourceContext,
  isFlipped,
  onShowAnswer,
}) => (
  <div className="flex flex-col w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 min-h-80 justify-between gap-6 transition-all">
    <div className="flex flex-col gap-3">
      <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
        Pergunta
      </span>
      {/* Inversão de Controle: Injetamos as diretrizes de Dark Mode na raiz do fluxo de estudo */}
      <MarkdownRenderer 
        content={frontContent} 
        className="text-slate-100 prose-invert prose-amber [&_.katex]:text-slate-100" 
      />
    </div>

    {isFlipped && backContent && (
      <div className="flex flex-col gap-4 border-t border-slate-800 pt-6 animate-fadeIn">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
            Resposta
          </span>
          <MarkdownRenderer 
            content={backContent} 
            className="text-slate-100 prose-invert prose-amber [&_.katex]:text-slate-100" 
          />
        </div>

        {sourceContext && (
          <div className="flex flex-col gap-1 bg-slate-950 p-3 rounded border border-slate-800/60 mt-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Contexto de Origem
            </span>
            <p className="text-xs text-slate-400 italic">{sourceContext}</p>
          </div>
        )}
      </div>
    )}

    {!isFlipped && (
      <button
        onClick={onShowAnswer}
        className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-xl transition-all border border-slate-700 mt-4 cursor-pointer flex items-center justify-center gap-3"
      >
        <span>Mostrar Resposta</span>
        <div className="flex items-center gap-1.5">
          <kbd className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-md text-[10px] font-mono text-slate-400 uppercase tracking-wider shadow-inner">
            Espaço
          </kbd>
          <span className="text-slate-500 text-[10px] font-bold lowercase">ou</span>
          <kbd className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-md text-[10px] font-mono text-slate-400 uppercase tracking-wider shadow-inner">
            Enter
          </kbd>
        </div>
      </button>
    )}
  </div>
);