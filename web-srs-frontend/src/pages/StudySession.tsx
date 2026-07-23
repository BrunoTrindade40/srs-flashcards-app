import { useMutation, useQuery } from "@apollo/client/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  GET_DUE_FLASHCARDS,
  SUBMIT_REVIEW,
  type GetDueFlashcardsResponse,
  type GetDueFlashcardsVariables,
} from "../lib/graphql/study";

export const StudySession: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // NOVO ESTADO: UI06 - Microcopy Afetivo e Gamificação
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);

  // Pureza de Componente: useRef evita renders em cascata ao capturar o tempo
  const startTimeRef = useRef<number>(0);

  const { data, loading, error } = useQuery<
    GetDueFlashcardsResponse,
    GetDueFlashcardsVariables
  >(GET_DUE_FLASHCARDS, {
    variables: { deckId: deckId ?? "" },
    skip: !deckId,
    fetchPolicy: "network-only",
  });

  const [submitReview, { loading: isSubmitting }] = useMutation(SUBMIT_REVIEW);

  const flashcards = data?.dueFlashcards ?? [];
  const currentCard = flashcards[currentIndex];

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [currentIndex]);

  // Função para avançar o Card (Adaptada para evitar o alert)
  const handleNextCard = useCallback(() => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      // Ativa o End State comemorativo
      setSessionCompleted(true);
    }
  }, [currentIndex, flashcards.length]);

  const handleRatingSubmit = useCallback(
    async (rating: number) => {
      if (isSubmitting || !currentCard) return;

      const reviewDurationMs = Date.now() - startTimeRef.current;

      try {
        await submitReview({
          variables: {
            flashcardId: currentCard.id,
            rating,
            reviewDurationMs,
          },
        });

        handleNextCard();
      } catch (err) {
        console.error("Falha na telemetria de revisão:", err);
        // O alert é mantido EXCLUSIVAMENTE para erros catastróficos (queda de rede)
        alert("Erro de conexão ao registrar resposta. Tente novamente.");
      }
    },
    [isSubmitting, currentCard, submitReview, handleNextCard],
  );

  // Acessibilidade e Prevenção de Fadiga de Decisão (Fogg Behavior Model)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName))
        return;

      // Se a sessão acabou, ignoramos o teclado para evitar cliques falsos
      if (!currentCard || isSubmitting || sessionCompleted) return;

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
  }, [
    isFlipped,
    currentCard,
    isSubmitting,
    sessionCompleted,
    handleRatingSubmit,
  ]);

  // UX de Carregamento
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mb-4 mr-4"></div>
        <p className="text-lg font-medium text-gray-600">
          Sincronizando foco no deck...
        </p>
      </div>
    );
  }

  // UX de Erro
  if (error || !deckId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-red-600">
        <h2 className="text-2xl font-bold mb-2">Erro de Sincronização</h2>
        <p>{error?.message || "Identificador do Deck ausente."}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-6 py-2 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300"
        >
          Voltar
        </button>
      </div>
    );
  }

  // UX Passivo Zerado desde o Início
  if (flashcards.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="bg-white p-10 rounded-3xl shadow-lg flex flex-col items-center text-center max-w-md w-full">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-green-700 mb-2">
            Deck em Dia!
          </h2>
          <p className="text-gray-600 mb-8 font-medium">
            Você não possui cartões vencidos neste tema hoje. Bom descanso!
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full flex justify-center py-4 px-4 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors"
          >
            Retornar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- NOVA TELA: MICROCOPY AFETIVO PARA SESSÃO ESPECÍFICA (UI06) ---
  if (sessionCompleted) {
    const effortLevel = flashcards.length;
    let affectiveTitle = "Sessão Concluída!";
    let affectiveMessage = "Um passo a mais na consolidação da sua memória.";

    // Gamificação baseada no esforço pontual em um único deck
    if (effortLevel >= 40) {
      affectiveTitle = "Foco Inabalável! 🔥";
      affectiveMessage = `Você dominou ${effortLevel} conceitos deste baralho. Isso é o estado da arte do aprendizado ativo!`;
    } else if (effortLevel >= 15) {
      affectiveTitle = "Excelente Consistência! 🧠";
      affectiveMessage = `Você avançou significativamente neste tema com ${effortLevel} cartões revisados.`;
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 animate-fade-in p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl flex flex-col items-center text-center max-w-md w-full border-t-4 border-blue-500">
          <div className="text-7xl mb-6">✨</div>
          <h2 className="text-3xl font-extrabold text-gray-800 mb-4">
            {affectiveTitle}
          </h2>
          <p className="text-gray-600 mb-8 font-medium text-lg leading-relaxed">
            {affectiveMessage}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full flex justify-center py-4 px-4 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-transform hover:-translate-y-1"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- RENDERIZAÇÃO DO FLASHCARD INDIVIDUAL ---
  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 font-sans">
      <div className="w-full max-w-3xl flex justify-between items-center mb-6 mt-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-500 hover:text-gray-800 transition-colors font-medium flex items-center gap-1"
        >
          ← Sair
        </button>
        <div className="text-sm font-bold text-gray-500 uppercase tracking-wide">
          Sessão Focada • {currentIndex + 1} / {flashcards.length}
        </div>
      </div>

      <div className="w-full max-w-3xl bg-gray-200 rounded-full h-2 mb-8 overflow-hidden shadow-inner">
        <div
          className="bg-blue-500 h-2 transition-all duration-500 ease-out"
          style={{ width: `${(currentIndex / flashcards.length) * 100}%` }}
        ></div>
      </div>

      <div
        className={`w-full max-w-3xl min-h-[400px] flex flex-col bg-white rounded-3xl shadow-xl transition-all duration-300 ease-in-out ${!isFlipped ? "cursor-pointer hover:shadow-2xl hover:-translate-y-1" : ""}`}
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center border-b border-gray-100">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-6">
            Frente (Pergunta)
          </h3>
          <p
            className={`font-medium text-gray-900 whitespace-pre-wrap leading-relaxed transition-all duration-300 ${isFlipped ? "text-xl text-gray-500" : "text-3xl"}`}
          >
            {currentCard.front}
          </p>
        </div>

        {isFlipped ? (
          <div className="flex-1 flex flex-col p-8 bg-gray-50 rounded-b-3xl animate-fade-in">
            <div className="flex-1 flex flex-col items-center justify-center text-center mb-8">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-green-700 mb-6">
                Verso (Resposta)
              </h3>
              <p className="text-2xl text-gray-800 font-medium whitespace-pre-wrap leading-relaxed">
                {currentCard.back}
              </p>
            </div>

            <hr className="border-gray-200 w-full mb-6" />

            <div className="flex flex-wrap justify-between gap-3 w-full">
              <button
                disabled={isSubmitting}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRatingSubmit(1);
                }}
                className="py-4 flex flex-col items-center justify-center rounded-2xl font-bold text-red-800 bg-red-100 hover:bg-red-200 transition-colors shadow-sm w-[calc(50%-0.5rem)] md:w-[calc(25%-0.75rem)]"
              >
                Errei{" "}
                <span className="text-xs font-medium text-red-600 mt-1 opacity-80">
                  Tecla 1
                </span>
              </button>
              <button
                disabled={isSubmitting}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRatingSubmit(2);
                }}
                className="py-4 flex flex-col items-center justify-center rounded-2xl font-bold text-orange-800 bg-orange-100 hover:bg-orange-200 transition-colors shadow-sm w-[calc(50%-0.5rem)] md:w-[calc(25%-0.75rem)]"
              >
                Difícil{" "}
                <span className="text-xs font-medium text-orange-600 mt-1 opacity-80">
                  Tecla 2
                </span>
              </button>
              <button
                disabled={isSubmitting}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRatingSubmit(3);
                }}
                className="py-4 flex flex-col items-center justify-center rounded-2xl font-bold text-green-800 bg-green-100 hover:bg-green-200 transition-colors shadow-sm w-[calc(50%-0.5rem)] md:w-[calc(25%-0.75rem)]"
              >
                Bom{" "}
                <span className="text-xs font-medium text-green-600 mt-1 opacity-80">
                  Tecla 3
                </span>
              </button>
              <button
                disabled={isSubmitting}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRatingSubmit(4);
                }}
                className="py-4 flex flex-col items-center justify-center rounded-2xl font-bold text-blue-800 bg-blue-100 hover:bg-blue-200 transition-colors shadow-sm w-[calc(50%-0.5rem)] md:w-[calc(25%-0.75rem)]"
              >
                Fácil{" "}
                <span className="text-xs font-medium text-blue-600 mt-1 opacity-80">
                  Tecla 4
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-6 bg-gray-50 rounded-b-3xl text-gray-500 font-semibold tracking-wide text-sm">
            Pressione ESPAÇO ou CLIQUE para revelar a resposta
          </div>
        )}
      </div>
    </div>
  );
};
