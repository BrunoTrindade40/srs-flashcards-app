import { useMutation } from "@apollo/client/react";
import React, { useEffect, useState } from "react";
import { useToast } from "../hooks/useToast";
import { UPDATE_FLASHCARD, type Flashcard } from "../lib/graphql/flashcard";

interface EditFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Utilizando o contrato estrito para forçar as tipagens corretas no Frontend
  flashcard: Flashcard;
}

export const EditFlashcardModal: React.FC<EditFlashcardModalProps> = ({
  isOpen,
  onClose,
  flashcard,
}) => {
  const { showToast } = useToast();

  const [front, setFront] = useState(flashcard.front);
  const [back, setBack] = useState(flashcard.back);
  const [sourceContext, setSourceContext] = useState(
    flashcard.sourceContext || "",
  );
  const [imageUrl, setImageUrl] = useState(flashcard.imageUrl || "");
  const [audioUrl, setAudioUrl] = useState(flashcard.audioUrl || "");

  const [showAdvanced, setShowAdvanced] = useState(
    !!flashcard.sourceContext || !!flashcard.imageUrl || !!flashcard.audioUrl,
  );

  const [updateFlashcard, { loading }] = useMutation(UPDATE_FLASHCARD);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!front.trim() || !back.trim() || loading) return;

    try {
      await updateFlashcard({
        variables: {
          data: {
            id: flashcard.id,
            front: front.trim(),
            back: back.trim(),
            sourceContext: sourceContext.trim() || undefined,
            imageUrl: imageUrl.trim() || undefined,
            audioUrl: audioUrl.trim() || undefined,
          },
        },
      });
      showToast("Flashcard atualizado com sucesso!", "success");
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro ao atualizar flashcard: ${err.message}`, "error");
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✏️</span>
            <h2 className="text-lg font-bold text-slate-100">
              Editar Flashcard
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-sm p-1 transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Frente (Pergunta) *
            </label>
            <textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              required
              rows={3}
              disabled={loading}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm font-mono resize-none focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Verso (Resposta) *
            </label>
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              required
              rows={4}
              disabled={loading}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm font-mono resize-none focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Seção Avançada de Edição */}
          <div className="flex flex-col gap-3 mt-1 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-bold text-amber-500 hover:text-amber-400 self-start cursor-pointer transition-colors"
            >
              {showAdvanced
                ? "− Ocultar Campos de Multimídia/Contexto"
                : "+ Editar Multimídia ou Contexto"}
            </button>

            {showAdvanced && (
              <div className="flex flex-col gap-4 animate-fade-in bg-slate-800/30 p-4 rounded-xl border border-slate-800/60">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Referência / Contexto
                  </label>
                  <input
                    type="text"
                    value={sourceContext}
                    onChange={(e) => setSourceContext(e.target.value)}
                    placeholder="Ex: Livro X, Página 42"
                    disabled={loading}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      URL da Imagem
                    </label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://exemplo.com/imagem.png"
                      disabled={loading}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      URL do Áudio
                    </label>
                    <input
                      type="url"
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      placeholder="https://exemplo.com/audio.mp3"
                      disabled={loading}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !front.trim() || !back.trim()}
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
