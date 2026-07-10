import { useMutation } from "@apollo/client/react";
import React, { useState } from "react";
import { GET_DECK } from "../lib/graphql/deck";
import { CREATE_FLASHCARD } from "../lib/graphql/flashcard";

import type { GetDeckResponse, GetDeckVariables } from "../lib/graphql/deck";
import type {
  CreateFlashcardResponse,
  CreateFlashcardVariables,
} from "../lib/graphql/flashcard";

interface CreateFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckId: string;
}

export const CreateFlashcardModal: React.FC<CreateFlashcardModalProps> = ({
  isOpen,
  onClose,
  deckId,
}) => {
  const [front, setFront] = useState<string>("");
  const [back, setBack] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [createFlashcard, { loading }] = useMutation<
    CreateFlashcardResponse,
    CreateFlashcardVariables
  >(CREATE_FLASHCARD, {
    // Manipulação direta do Cache para atualizar o ecrã instantaneamente
    update(cache) {
      const existingDeck = cache.readQuery<GetDeckResponse, GetDeckVariables>({
        query: GET_DECK,
        variables: { id: deckId },
      });

      if (existingDeck && existingDeck.deck) {
        cache.writeQuery<GetDeckResponse, GetDeckVariables>({
          query: GET_DECK,
          variables: { id: deckId },
          data: {
            deck: {
              ...existingDeck.deck,
              _count: {
                flashcards: (existingDeck.deck._count?.flashcards || 0) + 1,
              },
            },
          },
        });
      }
    },
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!front.trim() || !back.trim()) {
      setErrorMsg("A frente e o verso são obrigatórios.");
      return;
    }

    try {
      await createFlashcard({
        variables: {
          data: {
            front: front.trim(),
            back: back.trim(),
            deckId,
          },
        },
      });

      // Limpa os campos e permite criar mais cartões em sequência, sem fechar o modal
      setFront("");
      setBack("");
    } catch (err) {
      console.error("Falha ao criar o cartão:", err);
      setErrorMsg("Ocorreu um erro no servidor. Tente novamente.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Novo Flashcard</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-bold text-xl"
          >
            &times;
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Frente (Pergunta)
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Ex: O que é a Mitocôndria?"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Verso (Resposta)
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Ex: É o organelo responsável pela respiração celular e produção de energia."
              value={back}
              onChange={(e) => setBack(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
            >
              Concluído
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition"
            >
              {loading ? "A salvar..." : "Salvar e Adicionar Outro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
