import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
// Importação estrita de hooks compatível com Apollo Client v4.1.9
import { useMutation, useQuery } from "@apollo/client/react";

import { CreateFlashcardModal } from "../components/CreateFlashcardModal";

//Importação de Valores Executáveis
import { GET_DECK } from "../lib/graphql/deck";
import {
  GET_DECK_FLASHCARDS,
  REMOVE_FLASHCARD,
} from "../lib/graphql/flashcard";

//Importação Exclusiva de Tipos (Vite verbatimModuleSyntax)
import { ConfirmModal } from "../components/ConfirmModal";
import type { GetDeckResponse, GetDeckVariables } from "../lib/graphql/deck";
import type {
  GetDeckFlashcardsResponse,
  GetDeckFlashcardsVariables,
  RemoveFlashcardResponse,
  RemoveFlashcardVariables,
} from "../lib/graphql/flashcard";

export const DeckDetails: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  //Estados para controlar o Modal de Confirmação
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  // --- QUERIES ---
  const {
    data: deckData,
    loading: loadingDeck,
    error: deckError,
  } = useQuery<GetDeckResponse, GetDeckVariables>(GET_DECK, {
    variables: { id: deckId ?? "" },
    skip: !deckId,
  });

  const { data: flashcardsData, loading: loadingCards } = useQuery<
    GetDeckFlashcardsResponse,
    GetDeckFlashcardsVariables
  >(GET_DECK_FLASHCARDS, {
    variables: { deckId: deckId ?? "" },
    skip: !deckId,
    fetchPolicy: "cache-and-network",
  });

  // --- MUTATIONS ---
  const [removeFlashcard, { loading: isDeleting }] = useMutation<
    RemoveFlashcardResponse,
    RemoveFlashcardVariables
  >(REMOVE_FLASHCARD, {
    update(cache, { data }, { variables }) {
      if (!data?.removeFlashcard || !variables?.id) return;

      // 1. Remove o cartão visualmente da Lista em cache
      const existingCards = cache.readQuery<
        GetDeckFlashcardsResponse,
        GetDeckFlashcardsVariables
      >({
        query: GET_DECK_FLASHCARDS,
        variables: { deckId: deckId ?? "" },
      });

      if (existingCards?.deckFlashcards) {
        cache.writeQuery<GetDeckFlashcardsResponse, GetDeckFlashcardsVariables>(
          {
            query: GET_DECK_FLASHCARDS,
            variables: { deckId: deckId ?? "" },
            data: {
              deckFlashcards: existingCards.deckFlashcards.filter(
                (c) => c.id !== variables.id,
              ),
            },
          },
        );
      }

      // 2. Decrementa o Contador Total do Deck
      const existingDeck = cache.readQuery<GetDeckResponse, GetDeckVariables>({
        query: GET_DECK,
        variables: { id: deckId ?? "" },
      });

      if (existingDeck?.deck) {
        cache.writeQuery<GetDeckResponse, GetDeckVariables>({
          query: GET_DECK,
          variables: { id: deckId ?? "" },
          data: {
            deck: {
              ...existingDeck.deck,
              _count: {
                flashcards: Math.max(
                  0,
                  (existingDeck.deck._count?.flashcards || 0) - 1,
                ),
              },
            },
          },
        });
      }
    },
  });

  // --- HANDLERS ---
  const confirmDeletion = async () => {
    if (!cardToDelete) return;
    try {
      await removeFlashcard({ variables: { id: cardToDelete } });
      setCardToDelete(null); // Fecha o modal após sucesso
    } catch (err) {
      console.error("Erro ao excluir cartão:", err);
      alert("Não foi possível excluir o cartão no momento.");
      setCardToDelete(null);
    }
  };

  // --- RENDERIZAÇÃO DE ESTADOS ---
  if (loadingDeck) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-700 font-medium">
          Carregando os detalhes do baralho...
        </p>
      </div>
    );
  }

  if (deckError || !deckData?.deck) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
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

  const { deck } = deckData;

  // --- INTERFACE PRINCIPAL ---
  return (
    <div className="p-6 md:p-8 w-full max-w-4xl mx-auto space-y-6">
      {/* Bloco de Cabeçalho do Deck */}
      <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col md:flex-row md:justify-between md:items-center border border-gray-200">
        <div className="mb-6 md:mb-0">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-blue-600 text-sm font-bold hover:underline mb-2 block"
          >
            &larr; Voltar para Decks
          </button>
          <h1 className="text-3xl font-extrabold text-slate-900">
            {deck.title}
          </h1>
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

      {/* Bloco de Métricas e Ações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            Métricas do Deck
          </h3>
          <div className="text-4xl font-extrabold text-blue-700 mb-1">
            {deck._count?.flashcards || 0}
          </div>
          <p className="text-gray-600 font-bold">Cartões Totais</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 flex flex-col justify-center items-center text-center">
          <h3 className="text-lg font-bold text-slate-900 mb-2">
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

      {/* Bloco de Listagem de Flashcards */}
      <div className="mt-12 pt-6 border-t border-gray-200">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-6">
          Conteúdo do Deck
        </h2>

        {loadingCards ? (
          <p className="text-gray-600 font-medium">Sincronizando cartões...</p>
        ) : flashcardsData?.deckFlashcards.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600 font-medium">
              Nenhum cartão cadastrado. Crie o seu primeiro flashcard para
              começar os estudos!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {flashcardsData?.deckFlashcards.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-shadow"
              >
                <div className="flex-1 w-full">
                  <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-1">
                    Frente
                  </h4>
                  <p className="text-slate-900 font-bold mb-4 whitespace-pre-wrap">
                    {card.front}
                  </p>

                  <h4 className="text-xs font-extrabold text-green-700 uppercase tracking-widest mb-1">
                    Verso
                  </h4>
                  <p className="text-gray-700 font-medium whitespace-pre-wrap">
                    {card.back}
                  </p>
                </div>

                <div className="flex w-full md:w-auto md:flex-col justify-end space-y-0 space-x-2 md:space-x-0 md:space-y-2">
                  <button
                    // Em vez de chamar delete direto, abrimos o Modal
                    onClick={() => setCardToDelete(card.id)}
                    className="px-4 py-2 w-full bg-red-50 text-red-700 font-bold rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateFlashcardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        deckId={deck.id}
      />
      {/* Renderização do Modal de Confirmação */}
      <ConfirmModal
        isOpen={!!cardToDelete}
        title="Excluir Flashcard"
        message="O conteúdo deste cartão será apagado e ele não aparecerá mais nas suas sessões de estudo. Deseja continuar?"
        onConfirm={confirmDeletion}
        onCancel={() => setCardToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
