import React, { useState } from "react";
// Correção 1: Importação de hooks a partir do módulo específico para React (Apollo v4)
import { useMutation, useQuery } from "@apollo/client/react";
import { useNavigate, useParams } from "react-router-dom";

// Correção 2: Especificação de tipagem estrita no import (verbatimModuleSyntax)
import {
  GET_DUE_FLASHCARDS,
  SUBMIT_REVIEW,
  type GetDueFlashcardsData,
} from "../lib/graphql/study";

// Correção 3: Substituição do 'enum' por um POJO com const assertion (erasableSyntaxOnly)
const Rating = {
  AGAIN: 1,
  HARD: 2,
  GOOD: 3,
  EASY: 4,
} as const;

// Extraímos as chaves numéricas do objeto puramente para a assinatura do TypeScript
type RatingType = (typeof Rating)[keyof typeof Rating];

export const StudySession: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const { data, loading, error } = useQuery<GetDueFlashcardsData>(
    GET_DUE_FLASHCARDS,
    {
      variables: { deckId },
      fetchPolicy: "network-only",
    },
  );

  const [submitReview] = useMutation(SUBMIT_REVIEW);

  if (loading) {
    return (
      <div className="flex w-full h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium text-lg">
          Carregando sessão...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex w-full h-screen items-center justify-center bg-gray-50">
        <p className="text-red-500">Ocorreu um erro ao carregar os cards.</p>
      </div>
    );
  }

  const flashcards = data.dueFlashcards;

  if (flashcards.length === 0 || currentIndex >= flashcards.length) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen bg-gray-50 gap-6">
        <h2 className="text-2xl font-bold text-gray-800">Sessão Concluída!</h2>
        <p className="text-gray-600">
          Não há mais cards pendentes para revisão no momento.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  const handleReveal = () => {
    setIsFlipped(true);
  };

  const handleRate = async (rating: RatingType) => {
    try {
      await submitReview({
        variables: {
          flashcardId: currentCard.id,
          rating,
        },
      });

      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      console.error("Falha ao submeter revisão:", err);
    }
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gray-100 py-10 px-4">
      {/* Indicador de Progresso */}
      <div className="flex w-full max-w-2xl justify-between items-center mb-8">
        <span className="text-gray-500 font-medium">
          Card {currentIndex + 1} de {flashcards.length}
        </span>
      </div>

      {/* Cartão Central */}
      <div className="flex flex-col w-full max-w-2xl bg-white shadow-lg rounded-xl overflow-hidden min-h-[400px]">
        {/* Frente do Card */}
        <div className="flex flex-col flex-1 p-8 items-center justify-center border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Frente
          </h3>
          <p className="text-xl text-gray-800 text-center">
            {currentCard.front}
          </p>
        </div>

        {/* Verso do Card (Condicional) */}
        {isFlipped ? (
          <div className="flex flex-col flex-1 p-8 items-center justify-center bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Verso
            </h3>
            <p className="text-xl text-gray-800 text-center">
              {currentCard.back}
            </p>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-gray-50">
            <button
              onClick={handleReveal}
              className="flex px-8 py-3 bg-blue-100 text-blue-700 font-bold rounded-lg hover:bg-blue-200 transition-colors"
            >
              Revelar Resposta
            </button>
          </div>
        )}
      </div>

      {/* Controles de Avaliação */}
      {isFlipped && (
        <div className="flex flex-row flex-wrap items-center justify-center gap-4 mt-8 w-full max-w-2xl">
          <button
            onClick={() => handleRate(Rating.AGAIN)}
            className="flex flex-1 min-w-[120px] justify-center py-3 bg-red-100 text-red-700 font-semibold rounded hover:bg-red-200 transition-colors"
          >
            Errei (1)
          </button>
          <button
            onClick={() => handleRate(Rating.HARD)}
            className="flex flex-1 min-w-[120px] justify-center py-3 bg-orange-100 text-orange-700 font-semibold rounded hover:bg-orange-200 transition-colors"
          >
            Difícil (2)
          </button>
          <button
            onClick={() => handleRate(Rating.GOOD)}
            className="flex flex-1 min-w-[120px] justify-center py-3 bg-green-100 text-green-700 font-semibold rounded hover:bg-green-200 transition-colors"
          >
            Bom (3)
          </button>
          <button
            onClick={() => handleRate(Rating.EASY)}
            className="flex flex-1 min-w-[120px] justify-center py-3 bg-blue-100 text-blue-700 font-semibold rounded hover:bg-blue-200 transition-colors"
          >
            Fácil (4)
          </button>
        </div>
      )}
    </div>
  );
};
