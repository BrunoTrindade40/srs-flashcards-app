import React, { useState } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface EditFlashcardModalProps {
  initialFront: string;
  initialBack: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (front: string, back: string) => void;
}

/**
 * SRP: Responsável estritamente por gerenciar o estado local da edição e a pré-visualização.
 * Atualizado para React 19: Evita renderizações em cascata abolindo o uso indevido de useEffect.
 */
export const EditFlashcardModal: React.FC<EditFlashcardModalProps> = ({
  initialFront,
  initialBack,
  isOpen,
  onClose,
  onSave,
}) => {
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);
  const [wasOpen, setWasOpen] = useState(isOpen);

  // 🟡 ALERTA CORRIGIDO: Render Phase State Update.
  // Se a prop isOpen mudar, atualizamos o estado imediatamente durante a renderização.
  // O React descarta a árvore antiga e renderiza a nova de uma vez só (sem efeito cascata).
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setFront(initialFront);
      setBack(initialBack);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 p-4">
      <div className="flex flex-col w-full max-w-5xl bg-slate-900 rounded-lg shadow-2xl overflow-hidden max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-slate-800">
          <h2 className="text-xl font-bold text-slate-100">
            Curadoria Visual: Edição
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-semibold"
          >
            ✕ Fechar
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <div className="flex flex-col w-full md:w-1/2 p-5 border-r border-slate-800 overflow-y-auto gap-6 bg-slate-900">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                Frente (Pergunta)
              </label>
              {/* 🔵 SUGESTÃO CORRIGIDA: min-h-40 ao invés de min-h-[160px] */}
              <textarea
                className="w-full min-h-40 p-3 bg-slate-950 text-slate-100 border border-slate-700 rounded focus:outline-none focus:border-amber-500 wrap-break-word resize-y"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Insira texto, markdown ou $Equações$ aqui..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                Verso (Resposta)
              </label>
              {/* 🔵 SUGESTÃO CORRIGIDA: min-h-40 ao invés de min-h-[160px] */}
              <textarea
                className="w-full min-h-40 p-3 bg-slate-950 text-slate-100 border border-slate-700 rounded focus:outline-none focus:border-amber-500 wrap-break-word resize-y"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Resposta estruturada..."
              />
            </div>
          </div>

          <div className="flex flex-col w-full md:w-1/2 p-5 bg-slate-950 overflow-y-auto gap-6 shadow-inner">
            <div className="flex flex-col">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">
                Preview: Frente
              </h3>
              {/* 🔵 SUGESTÃO CORRIGIDA: min-h-30 ao invés de min-h-[120px] */}
              <div className="p-4 bg-slate-900 rounded border border-slate-800 min-h-30">
                <MarkdownRenderer
                  content={front || "*Nenhum conteúdo na frente*"}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">
                Preview: Verso
              </h3>
              {/* 🔵 SUGESTÃO CORRIGIDA: min-h-30 ao invés de min-h-[120px] */}
              <div className="p-4 bg-slate-900 rounded border border-slate-800 min-h-30">
                <MarkdownRenderer
                  content={back || "*Nenhum conteúdo no verso*"}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 p-5 border-t border-slate-800 bg-slate-900">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(front, back)}
            className="px-5 py-2 text-sm font-bold bg-amber-600 text-slate-950 rounded hover:bg-amber-500 transition-colors"
          >
            Salvar e Compilar
          </button>
        </div>
      </div>
    </div>
  );
};
