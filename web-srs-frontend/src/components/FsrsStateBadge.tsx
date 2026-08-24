import React from "react";
import { FsrsState, isValidFsrsState } from "../domain/fsrs";

interface FsrsStateBadgeProps {
  rawState: number | null | undefined;
}

/**
 * 1. Padrão Dictionary / Tabela de Espalhamento (Lookup Table).
 * Utilizando `Record<FsrsState, ...>`, o TypeScript obriga que TODOS os estados
 * do FSRS sejam mapeados. Isso substitui o `_exhaustiveCheck` de forma nativa.
 * Se `FsrsState` ganhar um novo estado no futuro, este arquivo quebrará no build.
 */
const STATE_CONFIG: Record<FsrsState, { label: string; colorClass: string }> = {
  [FsrsState.NEW]: { 
    label: "Novo", 
    colorClass: "bg-blue-950 text-blue-400 border-blue-900" 
  },
  [FsrsState.LEARNING]: { 
    label: "Aprendendo", 
    colorClass: "bg-amber-950 text-amber-400 border-amber-900" 
  },
  [FsrsState.REVIEW]: { 
    label: "Revisão", 
    colorClass: "bg-emerald-950 text-emerald-400 border-emerald-900" 
  },
  [FsrsState.RELEARNING]: { 
    label: "Reaprendendo", 
    colorClass: "bg-rose-950 text-rose-400 border-rose-900" 
  },
};

export const FsrsStateBadge: React.FC<FsrsStateBadgeProps> = ({ rawState }) => {
  // 2. Padrão Bouncer: Higienização da fronteira de rede (Network Boundary)
  if (!isValidFsrsState(rawState)) {
    return (
      <div className="flex items-center justify-center px-2 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[10px] uppercase tracking-wider font-bold">
        Desconhecido
      </div>
    );
  }

  // 3. Acesso Imutável O(1)
  // Como `isValidFsrsState` é um Type Guard, `rawState` agora é reconhecido como FsrsState
  const { label, colorClass } = STATE_CONFIG[rawState];

  // 4. Renderização 100% Flexbox
  return (
    <div className={`flex items-center justify-center px-2 py-1 border rounded text-[10px] uppercase tracking-wider font-bold shadow-sm ${colorClass}`}>
      {label}
    </div>
  );
};