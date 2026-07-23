import { useQuery } from "@apollo/client/react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Preservadas as suas importações originais
import { CreateDeckModal } from "../components/CreateDeckModal";
import type { GetMyDecksResponse } from "../lib/graphql/deck";
import { GET_MY_DECKS } from "../lib/graphql/deck";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  // Novo estado para controlar a abertura do modal nativamente
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
    <div className="p-6 md:p-8 w-full max-w-6xl mx-auto flex flex-col flex-1">
      {/* Cabeçalho 100% Flexbox */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold text-slate-900">Meus Decks</h1>
          <p className="text-gray-600 mt-1 font-medium">
            Gerencie seu conhecimento e inicie suas sessões de estudo.
          </p>
        </div>
        <button
          // Aciona o Modal ao invés de navegar para uma rota externa
          onClick={() => setIsCreateModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors shrink-0"
        >
          + Novo Deck
        </button>
      </div>

      {/* BANNER DO MODO CHAOS */}
      <div className="mb-10 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 md:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="z-10 max-w-2xl">
          <span className="inline-block bg-purple-500/20 text-purple-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 border border-purple-400/30">
            Dificuldades Desejáveis (Interleaving)
          </span>
          <h3 className="text-3xl md:text-4xl font-bold mb-3 flex items-center gap-3">
            Modo Chaos 🌪️
          </h3>
          <p className="text-indigo-200 mb-8 text-base md:text-lg leading-relaxed">
            Potencialize sua memória a longo prazo. Misture revisões atrasadas
            de todas as suas matérias em uma única sessão imersiva de alto
            impacto.
          </p>
          <button
            onClick={() => navigate("/chaos")}
            className="bg-white text-indigo-950 font-bold py-4 px-8 rounded-2xl shadow-lg hover:scale-105 hover:shadow-indigo-500/50 transition-all duration-300"
          >
            Iniciar Sessão Global
          </button>
        </div>

        {/* Elementos decorativos de fundo do Banner */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 rounded-full mix-blend-screen filter blur-[80px] opacity-40"></div>
        <div className="absolute -bottom-10 right-20 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40"></div>
      </div>
      {/* FIM DO BANNER DO MODO CHAOS */}

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
        /* CORREÇÃO ARQUITETURAL: Grid substituído por Flexbox + flex-wrap */
        <div className="flex flex-wrap gap-6">
          {decks.map((deck) => (
            <div
              key={deck.id}
              /* Calculo de largura Flexbox (w-[calc(...)]) substitui as colunas do Grid */
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col flex-1 mb-4">
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

              <div className="flex items-center justify-center text-sm font-bold text-blue-800 bg-blue-50 py-1 px-3 rounded-full mb-6 w-max border border-blue-100">
                {deck._count?.flashcards || 0} Cartões
              </div>

              <div className="flex gap-3 mt-auto w-full">
                <button
                  onClick={() => navigate(`/deck/${deck.id}`)}
                  className="flex-1 py-2 px-4 rounded-lg font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors text-center"
                >
                  Gerenciar
                </button>
                <button
                  onClick={() => navigate(`/study/${deck.id}`)}
                  disabled={!deck._count?.flashcards}
                  className={`flex-1 py-2 px-4 rounded-lg font-bold text-white transition-colors text-center ${
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

      {/* Instância do Modal Injetada via Interpolação Dinâmica JSX */}
      <CreateDeckModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
