import { useMutation } from "@apollo/client/react";
import "katex/dist/katex.min.css";
import React, { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { useToast } from "../hooks/useToast";
import { CREATE_FLASHCARD } from "../lib/graphql/flashcard";

interface CreateFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckId: string;
  onSuccess?: () => void;
}

type ModalStep = "DRAFT" | "CURATION";

export const CreateFlashcardModal: React.FC<CreateFlashcardModalProps> = ({
  isOpen,
  onClose,
  deckId,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [step, setStep] = useState<ModalStep>("DRAFT");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [sourceContext, setSourceContext] = useState("");

  const [createFlashcard, { loading }] = useMutation(CREATE_FLASHCARD);

  const handleClose = useCallback(() => {
    setStep("DRAFT");
    setFront("");
    setBack("");
    setSourceContext("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    try {
      await createFlashcard({
        variables: {
          data: {
            front,
            back,
            sourceContext: sourceContext.trim() ? sourceContext.trim() : null,
            deckId,
          },
        },
      });
      showToast("Flashcard curado e salvo com sucesso!", "success");
      onSuccess?.();
      handleClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro ao criar flashcard: ${err.message}`, "error");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 p-5 shrink-0 bg-slate-900">
          <div className="flex items-center gap-3">
            <span className="text-xl">{step === "DRAFT" ? "✍️" : "👁️"}</span>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {step === "DRAFT"
                  ? "Redação do Flashcard"
                  : "Curadoria Visual (UI05)"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {step === "DRAFT"
                  ? "Utilize Markdown para formatação e $...$ para LaTeX."
                  : "Revise a renderização estrutural antes da consolidação no banco."}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
            title="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {step === "DRAFT" ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Frente (Estímulo)
                </label>
                <textarea
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="Ex: Qual é a fórmula da energia cinética? $E_k = \frac{1}{2}mv^2$"
                  className="w-full h-28 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 resize-none font-mono"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Verso (Resposta Oculta)
                </label>
                <textarea
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="Ex: A energia cinética é dada por..."
                  className="w-full h-32 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 resize-none font-mono"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Contexto de Origem / Referencial (Opcional)
                </label>
                <input
                  type="text"
                  value={sourceContext}
                  onChange={(e) => setSourceContext(e.target.value)}
                  placeholder="Ex: Halliday & Resnick, Cap. 7 - Princípio do Trabalho e Energia"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-sans"
                />
                <p className="text-[10px] text-slate-500">
                  Referencial científico ou página de livro para embasamento do
                  Active Recall.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-3">
                  <div className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Frente Renderizada</span>
                    <span className="text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-amber-400">
                      AST / Markdown
                    </span>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none p-5 bg-slate-950/70 border border-slate-800 rounded-xl min-h-40 wrap-break-word shadow-inner">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {front || "*Nenhum estímulo providenciado.*"}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Verso Renderizado</span>
                    <span className="text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-emerald-400">
                      AST / Markdown
                    </span>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none p-5 bg-slate-950/70 border border-slate-800 rounded-xl min-h-40 wrap-break-word shadow-inner">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {back || "*Nenhuma resposta providenciada.*"}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {sourceContext.trim() && (
                <div className="flex flex-col gap-1 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Contexto de Origem / Referencial
                  </span>
                  <p className="text-xs text-slate-300 italic">
                    {sourceContext.trim()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-800 bg-slate-900 shrink-0 flex items-center justify-between">
          {step === "DRAFT" ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setStep("CURATION")}
                disabled={!front.trim() || !back.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                Validar Renderização ➔
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/5 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg cursor-pointer transition-all"
              >
                ✕ Descartar
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("DRAFT")}
                  disabled={loading}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 cursor-pointer transition-all"
                >
                  ← Editar
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                  {loading ? "Processando..." : "✓ Aceitar e Inserir"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
