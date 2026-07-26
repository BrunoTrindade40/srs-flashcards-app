import { gql } from "@apollo/client/core"; // CORREÇÃO: Apollo v4 Core
import { useMutation } from "@apollo/client/react"; // CORREÇÃO: Apollo v4 React
import React, { useEffect, useState } from "react";
import { useToast } from "../hooks/useToast";
import { CREATE_DECK } from "../lib/graphql/deck";

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateDeckModal: React.FC<CreateDeckModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { showToast } = useToast();

  const [createDeck, { loading }] = useMutation(CREATE_DECK, {
    // ⚡ OTIMIZAÇÃO DE CACHE: Insere o novo Deck diretamente no cache da query GET_MY_DECKS
    update(cache, { data }) {
      if (!data?.createDeck) return;

      cache.modify({
        fields: {
          myDecks(existingDeckRefs = []) {
            const newDeckRef = cache.writeFragment({
              data: data.createDeck,
              fragment: gql`
                fragment NewDeck on Deck {
                  id
                  title
                  description
                  _count {
                    flashcards
                  }
                }
              `,
            });
            return [...existingDeckRefs, newDeckRef];
          },
        },
      });
    },
    onCompleted: () => {
      showToast("Deck criado com sucesso!", "success");
      setTitle("");
      setDescription("");
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      showToast(`Erro ao criar deck: ${err.message}`, "error");
    },
  });

  // Tipagem React 19 para manipulador de formulário
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || loading) return;

    try {
      await createDeck({
        variables: {
          data: {
            title: title.trim(),
            description: description.trim() || undefined,
          },
        },
      });
    } catch (err: unknown) {
      // TypeScript Estrito: Proteção contra 'any'
      if (err instanceof Error) {
        console.error("Erro na submissão de deck:", err.message);
      } else {
        console.error("Erro desconhecido na submissão de deck:", err);
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
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <h2 className="text-lg font-bold text-slate-100">
              Criar Novo Deck
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-sm p-1 transition-colors cursor-pointer"
            aria-label="Fechar Modal"
          >
            ✕
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="deck-title"
              className="text-xs font-semibold text-slate-300 uppercase tracking-wider"
            >
              Título do Baralho *
            </label>
            <input
              id="deck-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Vocabulário de Inglês, NestJS & Prisma..."
              required
              disabled={loading}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="deck-desc"
              className="text-xs font-semibold text-slate-300 uppercase tracking-wider"
            >
              Descrição (Opcional)
            </label>
            <textarea
              id="deck-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve resumo do conteúdo ou objetivo deste baralho..."
              rows={3}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-600 resize-none focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
              disabled={loading || !title.trim()}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Criando..." : "Criar Baralho"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDeckModal;
