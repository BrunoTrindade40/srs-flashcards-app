import React, { useState } from "react";

// Correção: Propriedades e callback tipados com a nomenclatura exata do Schema GraphQL
interface EditFlashcardModalProps {
  isOpen: boolean;
  initialFrontContent: string;
  initialBackContent: string;
  initialSourceContext?: string | null;
  onClose: () => void;
  onSave: (
    frontContent: string,
    backContent: string,
    sourceContext?: string | null,
  ) => Promise<void>;
}

export const EditFlashcardModal: React.FC<EditFlashcardModalProps> = ({
  isOpen,
  initialFrontContent,
  initialBackContent,
  initialSourceContext = "",
  onClose,
  onSave,
}) => {
  const [frontContent, setFrontContent] = useState(initialFrontContent);
  const [backContent, setBackContent] = useState(initialBackContent);
  const [sourceContext, setSourceContext] = useState(
    initialSourceContext ?? "",
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!frontContent.trim() || !backContent.trim() || loading) return;
    try {
      setLoading(true);
      await onSave(
        frontContent.trim(),
        backContent.trim(),
        sourceContext.trim() ? sourceContext.trim() : null,
      );
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 p-5 shrink-0 bg-slate-900">
          <h2 className="text-lg font-bold text-slate-100">Editar Flashcard</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 flex flex-col gap-5 overflow-y-auto"
        >
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Frente (Estímulo)
            </label>
            <textarea
              value={frontContent}
              onChange={(e) => setFrontContent(e.target.value)}
              className="w-full h-28 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 resize-none font-mono"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Verso (Resposta Oculta)
            </label>
            <textarea
              value={backContent}
              onChange={(e) => setBackContent(e.target.value)}
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
              placeholder="Ex: Livro ou artigo de referência"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !frontContent.trim() || !backContent.trim()}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};