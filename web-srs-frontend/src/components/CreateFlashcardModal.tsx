import { gql } from "@apollo/client/core"; // CORREÇÃO: Import estrito da v4
import { useMutation } from "@apollo/client/react";
import React, { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CREATE_FLASHCARD } from "../lib/graphql/flashcard";

interface CreateFlashcardModalProps {
  deckId: string;
  isOpen?: boolean; // Adicionado para resolver o erro de tipagem
  onClose: () => void;
  onSuccess?: () => void; // Adicionado para triggar o Toast e o Refetch no Pai
}

export const CreateFlashcardModal: React.FC<CreateFlashcardModalProps> = ({
  deckId,
  isOpen = true,
  onClose,
  onSuccess,
}) => {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const [createFlashcard, { loading, error }] = useMutation(CREATE_FLASHCARD, {
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
                }
              `,
            });
            return [...existingFlashcardRefs, newFlashcardRef];
          },
        },
      });
    },
    onCompleted: () => {
      onSuccess?.(); // Executa o callback de sucesso (Toast/Refetch)
      onClose(); // Fecha o modal
    },
  });

  const handleSubmit = useCallback(
    async (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!front.trim() || !back.trim() || loading) return;

      try {
        await createFlashcard({
          variables: {
            data: {
              deckId,
              front,
              back,
            },
          },
        });
      } catch (err: unknown) {
        console.error("Erro ao criar flashcard:", err);
      }
    },
    [deckId, front, back, loading, createFlashcard],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null; // Segurança extra de renderização

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex flex-col w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex flex-row items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            Criar Novo Flashcard
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold p-2 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="Fechar Modal"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-row w-full border-b border-gray-200 bg-gray-50/50">
          <button
            type="button"
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              !isPreviewMode
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:bg-gray-100"
            }`}
            onClick={() => setIsPreviewMode(false)}
          >
            Edição (Markdown)
          </button>
          <button
            type="button"
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              isPreviewMode
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:bg-gray-100"
            }`}
            onClick={() => setIsPreviewMode(true)}
          >
            Preview Visual
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col p-6 h-[55vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-medium">
              Falha ao criar cartão: {error.message}
            </div>
          )}

          {!isPreviewMode ? (
            <form
              id="create-card-form"
              onSubmit={handleSubmit}
              className="flex flex-col grow gap-5"
            >
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Frente (Pergunta / Estímulo)
                </label>
                <textarea
                  className="flex-1 w-full p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
                  placeholder="Digite a pergunta. Suporta Markdown (ex: **negrito**, `código`)."
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="flex flex-col gap-2 flex-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Verso (Resposta / Explicação)
                </label>
                <textarea
                  className="flex-1 w-full p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
                  placeholder="Digite a resposta detalhada."
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </form>
          ) : (
            <div className="flex flex-col grow gap-6">
              <div className="flex flex-col flex-1 p-5 bg-gray-50 rounded-xl border border-gray-200 overflow-y-auto">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-200 pb-1">
                  Preview da Frente
                </span>
                <div className="prose prose-slate max-w-none text-gray-800">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {front || "*Nenhum conteúdo preenchido na frente.*"}
                  </ReactMarkdown>
                </div>
              </div>
              <div className="flex flex-col flex-1 p-5 bg-blue-50/50 rounded-xl border border-blue-100 overflow-y-auto">
                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3 border-b border-blue-200 pb-1">
                  Preview do Verso
                </span>
                <div className="prose prose-slate max-w-none text-gray-800">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {back || "*Nenhum conteúdo preenchido no verso.*"}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-row items-center justify-end p-6 border-t border-gray-100 bg-gray-50 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-200 transition-colors text-sm"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="create-card-form"
            className="flex flex-row items-center justify-center px-7 py-2.5 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !front.trim() || !back.trim()}
          >
            {loading ? "Salvando..." : "Salvar Flashcard"}
          </button>
        </div>
      </div>
    </div>
  );
};
