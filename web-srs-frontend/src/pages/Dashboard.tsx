import { useQuery } from "@apollo/client/react";
import React from "react";
import { useNavigate } from "react-router-dom";

import type { GetMyDecksResponse } from "../lib/graphql/deck";
import { GET_MY_DECKS } from "../lib/graphql/deck";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data, loading, error } = useQuery<GetMyDecksResponse>(GET_MY_DECKS, {
    fetchPolicy: "cache-and-network",
  });

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-lg font-medium text-gray-700">
          Carregando seus baralhos...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-red-600">
        <h2 className="text-2xl font-bold mb-2">Erro de Conexão</h2>
        <p>{error.message}</p>
      </div>
    );
  }

  const decks = data?.myDecks ?? [];

  return (
    // CORREÇÃO: Remoção do min-h-screen e bg-gray-100 (agora delegados ao MainLayout)
    <div className="p-6 md:p-8 w-full max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Meus Decks</h1>
          <p className="text-gray-600 mt-1 font-medium">
            Gerencie seu conhecimento e inicie suas sessões de estudo.
          </p>
        </div>
        <button
          onClick={() => navigate("/create-deck")}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors"
        >
          + Novo Deck
        </button>
      </div>

      {decks.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-200">
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Você ainda não possui nenhum Deck
          </h3>
          <p className="text-gray-600 font-medium">
            Crie seu primeiro baralho para começar a adicionar cartões e
            estudar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow"
            >
              <div className="flex-1 mb-4">
                {/* CORREÇÃO: Contraste absoluto com text-slate-900 e font-extrabold */}
                <h2
                  className="text-xl font-extrabold text-slate-900 mb-2 truncate"
                  title={deck.title}
                >
                  {deck.title}
                </h2>
                <p className="text-sm text-gray-700 line-clamp-2 font-medium">
                  {deck.description || "Sem descrição."}
                </p>
              </div>

              <div className="text-sm font-bold text-blue-800 bg-blue-50 py-1 px-3 rounded-full inline-block mb-6 w-max border border-blue-100">
                {deck._count?.flashcards || 0} Cartões
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto">
                <button
                  onClick={() => navigate(`/deck/${deck.id}`)}
                  className="py-2 px-4 rounded-lg font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Gerenciar
                </button>
                <button
                  onClick={() => navigate(`/study/${deck.id}`)}
                  disabled={!deck._count?.flashcards}
                  className={`py-2 px-4 rounded-lg font-bold text-white transition-colors ${
                    deck._count?.flashcards
                      ? "bg-green-600 hover:bg-green-700 shadow-sm"
                      : "bg-green-300 cursor-not-allowed"
                  }`}
                >
                  Estudar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
