import { gql } from "@apollo/client/core";
import { useMutation } from "@apollo/client/react";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useToast } from "../hooks/useToast";
import { CREATE_FLASHCARD } from "../lib/graphql/flashcard";

interface CreateFlashcardModalProps {
  deckId: string;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateFlashcardModal: React.FC<CreateFlashcardModalProps> = ({
  deckId,
  isOpen = true,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [sourceContext, setSourceContext] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [createFlashcard, { loading }] = useMutation(CREATE_FLASHCARD, {
    update(cache, { data }) {
      if (!data?.createFlashcard) return;

      cache.modify({
        id: cache.identify({ __typename: "Deck", id: deckId }),
        fields: {
          flashcards(existingFlashcardRefs = []) {
            const newFlashcardRef = cache.writeFragment({
              data: data.createFlashcard,
              fragment: gql`
                fragment NewFlashcard on Flashcard {
                  id
                  front
                  back
                  sourceContext
                  imageUrl
                  audioUrl
                }
              `,
            });
            return [...existingFlashcardRefs, newFlashcardRef];
          },
        },
      });
    },
  });

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!front.trim() || !back.trim() || loading) return;

    try {
      await createFlashcard({
        variables: {
          data: {
            deckId,
            front: front.trim(),
            back: back.trim(),
            sourceContext: sourceContext.trim() || undefined,
            imageUrl: imageUrl.trim() || undefined,
            audioUrl: audioUrl.trim() || undefined,
          },
        },
      });
      showToast("Flashcard criado com sucesso!", "success");
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Falha ao criar cartão: ${err.message}`, "error");
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-row items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-slate-100">
            Criar Novo Flashcard
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 font-bold p-1 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-row w-full border-b border-slate-800 bg-slate-900/50">
          <button
            type="button"
            className={`flex-1 py-3 text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer ${
              !isPreviewMode
                ? "text-amber-400 border-b-2 border-amber-500"
                : "text-slate-500 hover:bg-slate-800"
            }`}
            onClick={() => setIsPreviewMode(false)}
          >
            Edição
          </button>
          <button
            type="button"
            className={`flex-1 py-3 text-xs uppercase tracking-wider font-bold transition-colors cursor-pointer ${
              isPreviewMode
                ? "text-amber-400 border-b-2 border-amber-500"
                : "text-slate-500 hover:bg-slate-800"
            }`}
            onClick={() => setIsPreviewMode(true)}
          >
            Preview Visual
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col p-6 h-[55vh] overflow-y-auto custom-scrollbar">
          {!isPreviewMode ? (
            <form
              id="create-card-form"
              onSubmit={handleSubmit}
              className="flex flex-col grow gap-5"
            >
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Frente (Pergunta / Estímulo) *
                </label>
                <textarea
                  className="flex-1 w-full p-4 bg-slate-950 border border-slate-800 rounded-xl resize-none focus:outline-none focus:border-amber-500 transition-colors font-mono text-sm text-slate-100 placeholder-slate-600"
                  placeholder="Pergunta (Suporta Markdown: **negrito**, `código`)"
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="flex flex-col gap-2 flex-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Verso (Resposta / Explicação) *
                </label>
                <textarea
                  className="flex-1 w-full p-4 bg-slate-950 border border-slate-800 rounded-xl resize-none focus:outline-none focus:border-amber-500 transition-colors font-mono text-sm text-slate-100 placeholder-slate-600"
                  placeholder="Resposta detalhada"
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Seção KISS para Multimídia */}
              <div className="flex flex-col gap-3 mt-2 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-bold text-amber-500 hover:text-amber-400 self-start cursor-pointer transition-colors"
                >
                  {showAdvanced
                    ? "− Ocultar Campos de Multimídia/Contexto"
                    : "+ Adicionar Multimídia ou Contexto (Opcional)"}
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
                        placeholder="Ex: Livro X, Página 42 / Aula 5"
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
            </form>
          ) : (
            <div className="flex flex-col grow gap-6">
              <div className="flex flex-col flex-1 p-5 bg-slate-950 rounded-xl border border-slate-800 overflow-y-auto">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1">
                  Frente
                </span>
                <div className="prose prose-invert max-w-none text-slate-200">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {front || "*Frente vazia*"}
                  </ReactMarkdown>
                </div>
              </div>
              <div className="flex flex-col flex-1 p-5 bg-amber-500/5 rounded-xl border border-amber-500/20 overflow-y-auto">
                <span className="text-xs font-bold text-amber-500/80 uppercase tracking-widest mb-3 border-b border-amber-500/20 pb-1">
                  Verso
                </span>
                <div className="prose prose-invert prose-a:text-amber-400 max-w-none text-slate-200">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {back || "*Verso vazio*"}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-row items-center justify-end p-5 border-t border-slate-800 bg-slate-900 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-slate-400 font-medium hover:text-slate-200 hover:bg-slate-800 transition-colors text-xs cursor-pointer"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="create-card-form"
            className="flex flex-row items-center justify-center px-7 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl shadow-md hover:bg-amber-600 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            disabled={loading || !front.trim() || !back.trim()}
          >
            {loading ? "Salvando..." : "Salvar Flashcard"}
          </button>
        </div>
      </div>
    </div>
  );
};
