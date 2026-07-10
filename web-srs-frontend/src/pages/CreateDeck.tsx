import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Importação estrita compatível com Apollo Client v4.1.9
import { useMutation } from "@apollo/client/react";

import type {
  CreateDeckResponse,
  CreateDeckVariables,
  GetMyDecksResponse,
} from "../lib/graphql/deck";
import { CREATE_DECK, GET_MY_DECKS } from "../lib/graphql/deck";

export const CreateDeck: React.FC = () => {
  const navigate = useNavigate();

  // Controlo de Formulário Controlado
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  // Instanciação da Mutation com atualização de Cache
  const [createDeck, { loading }] = useMutation<
    CreateDeckResponse,
    CreateDeckVariables
  >(CREATE_DECK, {
    // O 'update' permite-nos injetar o novo deck no cache do Apollo,
    // poupando uma requisição HTTP quando voltarmos ao Dashboard.
    update(cache, { data }) {
      if (!data?.createDeck) return;

      const existingDecks = cache.readQuery<GetMyDecksResponse>({
        query: GET_MY_DECKS,
      });

      if (existingDecks && existingDecks.myDecks) {
        cache.writeQuery<GetMyDecksResponse>({
          query: GET_MY_DECKS,
          data: {
            myDecks: [data.createDeck, ...existingDecks.myDecks],
          },
        });
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validação de Frontend Básica
    if (!title.trim()) {
      setFormError("O título do Deck é obrigatório.");
      return;
    }

    try {
      await createDeck({
        variables: {
          data: {
            title: title.trim(),
            description: description.trim() || undefined,
          },
        },
      });

      // Redireciona para o Dashboard após o sucesso
      navigate("/dashboard");
    } catch (err) {
      console.error("Falha ao criar o deck:", err);
      setFormError(
        "Ocorreu um erro ao comunicar com o servidor. Tenta novamente.",
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Criar Novo Deck</h2>
          <p className="text-gray-500 text-sm mt-1">
            Organiza o teu conhecimento por áreas de estudo.
          </p>
        </div>

        {formError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Título do Deck <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="Ex: Inglês B2, Biologia Celular..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              maxLength={100}
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Descrição (Opcional)
            </label>
            <textarea
              id="description"
              placeholder="Breve resumo sobre o conteúdo deste deck..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
              maxLength={500}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 text-white font-medium rounded-lg shadow-sm transition-colors ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "A criar..." : "Criar Deck"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
