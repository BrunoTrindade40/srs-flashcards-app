import { useMutation, useQuery } from "@apollo/client/react";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type {
  GetDueFlashcardsResponse,
  GetDueFlashcardsVariables,
  SubmitReviewResponse,
  SubmitReviewVariables,
} from "../lib/graphql/study";
import { GET_DUE_FLASHCARDS, SUBMIT_REVIEW } from "../lib/graphql/study";

export const StudySession: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const { data, loading, error } = useQuery<
    GetDueFlashcardsResponse,
    GetDueFlashcardsVariables
  >(GET_DUE_FLASHCARDS, {
    variables: { deckId: deckId ?? "" },
    skip: !deckId,
    fetchPolicy: "network-only",
  });

  const [submitReview] = useMutation<
    SubmitReviewResponse,
    SubmitReviewVariables
  >(SUBMIT_REVIEW);

  const flashcards = data?.dueFlashcards ?? [];
  const currentCard = flashcards[currentIndex];

  const handleRatingSubmit = useCallback(
    async (rating: number) => {
      if (!currentCard) return;
      try {
        await submitReview({
          variables: {
            flashcardId: currentCard.id,
            rating,
          },
        });
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      } catch (err) {
        console.error("Falha na telemetria de revisão:", err);
        alert(
          "Erro ao registrar sua resposta. O servidor pode estar indisponível.",
        );
      }
    },
    [currentCard, submitReview],
  );

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName))
        return;

      if (!isFlipped) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsFlipped(true);
        }
      } else {
        if (["1", "2", "3", "4"].includes(e.key)) {
          e.preventDefault();
          handleRatingSubmit(parseInt(e.key, 10));
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isFlipped, handleRatingSubmit]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-lg font-medium text-gray-600">
          Sincronizando motor cognitivo...
        </p>
      </div>
    );
  }

  if (error || !deckId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-red-600">
        <h2 className="text-2xl font-bold mb-2">Erro de Sincronização</h2>
        <p>{error?.message || "Identificador do Deck ausente."}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded flex"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (flashcards.length === 0 || currentIndex >= flashcards.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="bg-white p-10 rounded-2xl shadow-sm flex flex-col items-center text-center max-w-md w-full">
          <h2 className="text-3xl font-bold text-green-700 mb-4">
            Sessão Concluída
          </h2>
          <p className="text-gray-700 mb-8 font-medium">
            Você zerou suas revisões pendentes para este deck hoje.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full flex justify-center py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          >
            Retornar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 font-sans">
      <div className="w-full max-w-3xl flex justify-between items-center mb-8 mt-4 text-sm font-bold text-gray-600 uppercase tracking-wide">
        <span>
          Cartão {currentIndex + 1} de {flashcards.length}
        </span>
        <span>Modo Padrão (FSRS)</span>
      </div>

      <div
        className={`w-full max-w-3xl min-h-[400px] flex flex-col bg-white rounded-2xl shadow-xl transition-all duration-300 ease-in-out ${
          !isFlipped
            ? "cursor-pointer hover:shadow-2xl hover:-translate-y-1"
            : ""
        }`}
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center border-b border-gray-100">
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-700 mb-6">
            Frente (Pergunta)
          </h3>
          <p className="text-3xl text-gray-900 font-medium whitespace-pre-wrap leading-relaxed">
            {currentCard.front}
          </p>
        </div>

        {isFlipped ? (
          <div className="flex-1 flex flex-col p-8 bg-gray-50 rounded-b-2xl animate-fade-in">
            <div className="flex-1 flex flex-col items-center justify-center text-center mb-8">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-green-700 mb-6">
                Verso (Resposta)
              </h3>
              <p className="text-xl text-gray-800 font-medium whitespace-pre-wrap leading-relaxed">
                {currentCard.back}
              </p>
            </div>

            <hr className="border-gray-200 w-full mb-6" />

            {/* Refatoração: Substituição do Grid por Flexbox */}
            <div className="flex flex-wrap justify-between gap-4 w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRatingSubmit(1);
                }}
                className="py-4 flex flex-col items-center justify-center rounded-xl font-bold text-red-800 bg-red-100 hover:bg-red-200 transition-colors shadow-sm cursor-pointer w-[calc(50%-0.5rem)] md:w-[calc(25%-0.75rem)]"
              >
                <span>Errei</span>
                <span className="text-xs font-medium text-red-600 mt-1 opacity-80">
                  Tecla 1
                </span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRatingSubmit(2);
                }}
                className="py-4 flex flex-col items-center justify-center rounded-xl font-bold text-orange-800 bg-orange-100 hover:bg-orange-200 transition-colors shadow-sm cursor-pointer w-[calc(50%-0.5rem)] md:w-[calc(25%-0.75rem)]"
              >
                <span>Difícil</span>
                <span className="text-xs font-medium text-orange-600 mt-1 opacity-80">
                  Tecla 2
                </span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRatingSubmit(3);
                }}
                className="py-4 flex flex-col items-center justify-center rounded-xl font-bold text-green-800 bg-green-100 hover:bg-green-200 transition-colors shadow-sm cursor-pointer w-[calc(50%-0.5rem)] md:w-[calc(25%-0.75rem)]"
              >
                <span>Bom</span>
                <span className="text-xs font-medium text-green-600 mt-1 opacity-80">
                  Tecla 3
                </span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRatingSubmit(4);
                }}
                className="py-4 flex flex-col items-center justify-center rounded-xl font-bold text-blue-800 bg-blue-100 hover:bg-blue-200 transition-colors shadow-sm cursor-pointer w-[calc(50%-0.5rem)] md:w-[calc(25%-0.75rem)]"
              >
                <span>Fácil</span>
                <span className="text-xs font-medium text-blue-600 mt-1 opacity-80">
                  Tecla 4
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-6 bg-gray-50 rounded-b-2xl text-gray-500 font-semibold tracking-wide">
            Pressione ESPAÇO ou CLIQUE para revelar a resposta
          </div>
        )}
      </div>
    </div>
  );
};
