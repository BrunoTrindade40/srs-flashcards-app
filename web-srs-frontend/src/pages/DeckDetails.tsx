import { useQuery } from "@apollo/client/react";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { CreateFlashcardModal } from "../components/CreateFlashcardModal";
import type { GetDeckResponse, GetDeckVariables } from "../lib/graphql/deck";
import { GET_DECK } from "../lib/graphql/deck";

export const DeckDetails: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, loading, error } = useQuery<GetDeckResponse, GetDeckVariables>(
    GET_DECK,
    {
      variables: { id: deckId ?? "" },
      skip: !deckId,
    },
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-700 font-medium">
          Carregando os detalhes do baralho...
        </p>
      </div>
    );
  }

  if (error || !data?.deck) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <p className="text-red-600 font-bold text-xl mb-4">
          Deck não encontrado.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg"
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  const { deck } = data;

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="mb-6 md:mb-0">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-blue-600 text-sm font-bold hover:underline mb-2 block"
            >
              &larr; Voltar para Decks
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{deck.title}</h1>
            {/* Ajuste de contraste */}
            <p className="text-gray-600 mt-2 font-medium">
              {deck.description || "Nenhuma descrição atribuída."}
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/study/${deck.id}`)}
              disabled={deck._count?.flashcards === 0}
              className={`px-6 py-3 font-bold rounded-lg shadow-sm transition-colors ${
                deck._count?.flashcards === 0
                  ? "bg-green-300 text-white cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              Iniciar Estudo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            {/* Ajuste de contraste e peso da fonte */}
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
              Métricas do Deck
            </h3>
            <div className="text-4xl font-extrabold text-blue-700 mb-1">
              {deck._count?.flashcards || 0}
            </div>
            <p className="text-gray-600 font-bold">Cartões Totais</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 flex flex-col justify-center items-center text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Construir Conhecimento
            </h3>
            <p className="text-gray-600 text-sm mb-4 font-medium">
              A melhor forma de reter conhecimento é ser ativo na sua criação.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 bg-blue-100 text-blue-800 font-bold rounded-lg hover:bg-blue-200 transition-colors w-full"
            >
              + Criar Flashcard
            </button>
          </div>
        </div>
      </div>

      <CreateFlashcardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        deckId={deck.id}
      />
    </div>
  );
};
