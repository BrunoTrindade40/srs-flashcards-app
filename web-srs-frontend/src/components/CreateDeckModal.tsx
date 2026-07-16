import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import React, { useState } from "react";

import type {
  CreateDeckResponse,
  CreateDeckVariables,
} from "../lib/graphql/deck";
import { CREATE_DECK } from "../lib/graphql/deck";

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateDeckModal: React.FC<CreateDeckModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const [createDeck, { loading }] = useMutation<
    CreateDeckResponse,
    CreateDeckVariables
  >(CREATE_DECK, {
    update(cache, { data }) {
      if (!data?.createDeck) return;

      cache.modify({
        fields: {
          myDecks(existingDecks = []) {
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
            return [newDeckRef, ...existingDecks];
          },
        },
      });
    },
  });

  // CORREÇÃO: Substituição de FormEventHandler por SubmitEventHandler
  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setServerError(null);

    try {
      await createDeck({
        variables: {
          data: {
            title,
            description: description || undefined,
          },
        },
      });

      setTitle("");
      setDescription("");
      onClose();
    } catch (error) {
      console.error("Falha ao criar o baralho:", error);
      setServerError("Não foi possível criar o baralho. Tente novamente.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-extrabold text-slate-900">Novo Deck</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-700 font-bold text-2xl transition-colors"
          >
            &times;
          </button>
        </div>

        {serverError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-100 flex">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="title" className="text-sm font-bold text-gray-700">
              Título
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Padrões de Arquitetura"
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="description"
              className="text-sm font-bold text-gray-700"
            >
              Descrição (Opcional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 font-bold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Salvando..." : "Salvar Deck"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
