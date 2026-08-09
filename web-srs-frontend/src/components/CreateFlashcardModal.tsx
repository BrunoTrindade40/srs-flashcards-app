import React from "react";
import { useCreateFlashcardModal } from "../hooks/useCreateFlashcardModal";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface CreateFlashcardModalProps {
  deckId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CreateFlashcardModal: React.FC<CreateFlashcardModalProps> = ({
  deckId,
  isOpen,
  onClose,
}) => {
  // 🟢 Toda a complexidade de mutação e atalhos é injetada via Hook
  const {
    front,
    setFront,
    back,
    setBack,
    sourceContext,
    setSourceContext,
    isPreviewMode,
    setIsPreviewMode,
    loading,
    handleSubmit,
    handleClose,
  } = useCreateFlashcardModal({ deckId, isOpen, onClose });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
      {/* 🟢 Flexbox rigoroso (sem CSS Grid) */}
      <div className="flex flex-col w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <span className="text-xl">✨</span>
            <h2 className="text-lg font-bold text-slate-100">
              Criar Novo Flashcard
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            title="Fechar (ESC)"
          >
            ✕
          </button>
        </div>

        {/* UI05 - Alternador de Curadoria Visual (Edição vs Preview AST) */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 py-2 gap-2">
          <button
            type="button"
            onClick={() => setIsPreviewMode(false)}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              !isPreviewMode
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ✏️ Edição
          </button>
          <button
            type="button"
            onClick={() => setIsPreviewMode(true)}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isPreviewMode
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            👁️ Curadoria Visual (Preview AST)
          </button>
        </div>

        {/* Corpo do Modal em Flexbox */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-y-auto p-6 gap-6"
        >
          {!isPreviewMode ? (
            /* Modo de Edição Lado a Lado / Empilhado via Flexbox */
            <div className="flex flex-col md:flex-row gap-6 w-full flex-1">
              <div className="flex flex-col flex-1 gap-2">
                <label className="text-xs font-bold text-amber-500 uppercase tracking-wider flex justify-between items-center">
                  <span>Frente (Pergunta / Estímulo) *</span>
                  <span className="text-[10px] text-slate-500 lowercase font-normal">
                    Markdown & LaTeX
                  </span>
                </label>
                <textarea
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="Ex: Qual a identidade de Euler? $e^{i\pi} + 1 = 0$"
                  className="flex-1 min-h-36 p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500/50 transition-all resize-none font-mono"
                  required
                />
              </div>

              <div className="flex flex-col flex-1 gap-2">
                <label className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex justify-between items-center">
                  <span>Verso (Resposta / Explicação) *</span>
                  <span className="text-[10px] text-slate-500 lowercase font-normal">
                    Markdown & LaTeX
                  </span>
                </label>
                <textarea
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="Digite a resposta ou explicação detalhada."
                  className="flex-1 min-h-36 p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500/50 transition-all resize-none font-mono"
                  required
                />
              </div>
            </div>
          ) : (
            /* UI05 - Modo de Curadoria Visual (Preview do AST) */
            <div className="flex flex-col md:flex-row gap-6 w-full flex-1">
              <div className="flex flex-col flex-1 gap-2 bg-slate-950 p-5 rounded-xl border border-slate-800 min-h-48 overflow-y-auto">
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-slate-800/80 pb-2 mb-1">
                  Frente (Preview AST)
                </span>
                {front.trim() ? (
                  <MarkdownRenderer content={front} />
                ) : (
                  <span className="text-xs text-slate-600 italic">
                    Nenhum conteúdo digitado para a frente.
                  </span>
                )}
              </div>

              <div className="flex flex-col flex-1 gap-2 bg-slate-950 p-5 rounded-xl border border-slate-800 min-h-48 overflow-y-auto">
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider border-b border-slate-800/80 pb-2 mb-1">
                  Verso (Preview AST)
                </span>
                {back.trim() ? (
                  <MarkdownRenderer content={back} />
                ) : (
                  <span className="text-xs text-slate-600 italic">
                    Nenhum conteúdo digitado para o verso.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Contexto de Origem Opcional */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/60">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Contexto de Origem (Opcional)
            </label>
            <input
              type="text"
              value={sourceContext}
              onChange={(e) => setSourceContext(e.target.value)}
              placeholder="Ex: Capítulo 3 do livro X, Aula de Física..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-slate-700 transition-all"
            />
          </div>

          {/* Ações do Rodapé */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <span className="text-[11px] text-slate-500">
              Pressione{" "}
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400 font-mono">
                ESC
              </kbd>{" "}
              para cancelar
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !front.trim() || !back.trim()}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer"
              >
                {loading ? "Salvando..." : "Confirmar e Criar Card"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
