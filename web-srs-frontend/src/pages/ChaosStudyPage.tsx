import { gql, type TypedDocumentNode } from "@apollo/client/core";
import { useMutation, useQuery } from "@apollo/client/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// --- TIPAGENS DA QUERY (MODO CHAOS) ---
interface FlashcardData {
  id: string;
  front: string;
  back: string;
  deck: { title: string };
}
interface ChaosQueueResponse {
  chaosStudyQueue: FlashcardData[];
}
interface ChaosQueueVariables {
  limit: number;
}

const GET_CHAOS_QUEUE: TypedDocumentNode<
  ChaosQueueResponse,
  ChaosQueueVariables
> = gql`
  query GetChaosQueue($limit: Int!) {
    chaosStudyQueue(limit: $limit) {
      id
      front
      back
      deck {
        title
      }
    }
  }
`;

// --- TIPAGENS DA MUTATION (FSRS RATING) ---
interface SubmitReviewResponse {
  submitReview: boolean;
}
interface SubmitReviewVariables {
  flashcardId: string;
  rating: number;
  reviewDurationMs: number;
}

const SUBMIT_REVIEW: TypedDocumentNode<
  SubmitReviewResponse,
  SubmitReviewVariables
> = gql`
  mutation SubmitReview(
    $flashcardId: ID!
    $rating: Int!
    $reviewDurationMs: Int!
  ) {
    submitReview(
      flashcardId: $flashcardId
      rating: $rating
      reviewDurationMs: $reviewDurationMs
    )
  }
`;

export const ChaosStudyPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // CORREÇÃO UI06: Estado para controlar o fim da sessão sem usar alert() genérico
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const startTimeRef = useRef<number>(0);

  // Parâmetro de Workload Management (Mitigação do Efeito Bola de Neve)
  const SESSION_LIMIT = 50;

  const { data, loading, error } = useQuery(GET_CHAOS_QUEUE, {
    variables: { limit: SESSION_LIMIT },
    fetchPolicy: "network-only",
  });

  const [submitReview, { loading: isSubmitting }] = useMutation(SUBMIT_REVIEW);

  const flashcards = data?.chaosStudyQueue || [];
  const currentCard = flashcards[currentCardIndex];

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [currentCardIndex]);

  const handleNextCard = useCallback(() => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      // CORREÇÃO UI06: Em vez de um alert quebra-fluxo, ativamos a tela de Gamificação
      setSessionCompleted(true);
    }
  }, [currentCardIndex, flashcards.length]);

  const handleRateCard = useCallback(
    async (rating: number) => {
      if (isSubmitting || !currentCard) return;

      const reviewDurationMs = Date.now() - startTimeRef.current;

      try {
        await submitReview({
          variables: { flashcardId: currentCard.id, rating, reviewDurationMs },
        });
        handleNextCard();
      } catch (err) {
        console.error("Erro ao salvar avaliação FSRS:", err);
        // Aqui mantemos o alert apenas para falhas críticas de rede, pois foge do "Caminho Feliz"
        alert("Falha de conexão com o motor cognitivo. Tente novamente.");
      }
    },
    [isSubmitting, currentCard, submitReview, handleNextCard],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName))
        return;
      if (!currentCard || isSubmitting || sessionCompleted) return;

      if (!isFlipped) {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          setIsFlipped(true);
        }
      } else {
        if (["1", "2", "3", "4"].includes(e.key)) {
          e.preventDefault();
          handleRateCard(parseInt(e.key, 10));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, currentCard, isSubmitting, handleRateCard, sessionCompleted]);

  if (loading)
    return (
      /* ... Seu loading mantido ... */
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500 mb-4 mr-4"></div>
        <div className="text-indigo-300 text-xl font-bold animate-pulse">
          Sincronizando Interleaving... 🌪️
        </div>
      </div>
    );

  if (error)
    return (
      /* ... Seu error mantido ... */
      <div className="p-4 text-red-500 bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-xl">
          <h2 className="font-bold">Erro</h2>
          <p>{error.message}</p>
        </div>
      </div>
    );

  if (flashcards.length === 0)
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl text-center max-w-md">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold mb-4">Passivo Zerado!</h2>
          <p className="text-gray-500 mb-6">
            Não há cartões vencidos no momento. Sua memória está otimizada!
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );

  // --- CORREÇÃO UI06: TELA DE MICROCOPY AFETIVO (FIM DE SESSÃO) ---
  if (sessionCompleted) {
    // Gerador de Microcopy Dinâmico baseado no esforço (Teoria da Autodeterminação)
    const effortLevel = flashcards.length;
    let affectiveTitle = "Sessão Concluída!";
    let affectiveMessage = "Excelente trabalho mantendo seu cérebro ativo.";

    if (effortLevel >= 40) {
      affectiveTitle = "Resiliência Incrível! 🔥";
      affectiveMessage = `Você acaba de processar ${effortLevel} revisões no Modo Chaos. Isso exige um esforço cognitivo massivo. Descanse!`;
    } else if (effortLevel >= 15) {
      affectiveTitle = "Ótimo Ritmo! 🧠";
      affectiveMessage = `Mais ${effortLevel} conceitos consolidados na sua memória de longo prazo.`;
    }

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-800 p-10 rounded-3xl shadow-2xl text-center max-w-md border border-indigo-500/30">
          <div className="text-7xl mb-6 drop-shadow-lg">✨</div>
          <h2 className="text-3xl font-extrabold text-white mb-4">
            {affectiveTitle}
          </h2>
          <p className="text-indigo-200 mb-8 leading-relaxed text-lg">
            {affectiveMessage}
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex-1 bg-white text-indigo-900 font-bold py-4 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERIZAÇÃO DO FLASHCARD MANTIDA ---
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-3xl flex justify-between items-center mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-slate-400 hover:text-white flex items-center gap-2 font-medium"
        >
          ← Sair
        </button>
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
          Modo Chaos 🌪️
        </h2>
        <div className="text-slate-400 font-medium tracking-wide">
          Cartão {currentCardIndex + 1} de {flashcards.length}
        </div>
      </div>

      <div className="w-full max-w-3xl bg-slate-800 rounded-full h-2.5 mb-8 overflow-hidden shadow-inner">
        <div
          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 transition-all duration-500 ease-out"
          style={{ width: `${(currentCardIndex / flashcards.length) * 100}%` }}
        ></div>
      </div>

      <div
        className={`w-full max-w-3xl flex-1 max-h-[600px] min-h-[400px] bg-white rounded-3xl shadow-2xl flex flex-col relative transition-transform duration-300 ${!isFlipped ? "cursor-pointer hover:-translate-y-1" : ""}`}
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 shadow-sm">
          <span className="bg-indigo-100 text-indigo-800 text-xs font-extrabold px-5 py-2 rounded-full uppercase border border-indigo-200 tracking-wider">
            {currentCard.deck.title}
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center p-8 mt-6 overflow-y-auto border-b border-gray-100">
          <h3
            className={`font-medium text-center transition-all duration-300 ${isFlipped ? "text-lg text-slate-400 mb-6" : "text-3xl text-slate-900"}`}
          >
            {currentCard.front}
          </h3>
          {isFlipped && (
            <div className="w-16 h-1 bg-slate-200 rounded-full mb-6"></div>
          )}
          {isFlipped && (
            <div className="animate-fade-in w-full">
              <p className="text-2xl text-slate-800 text-center leading-relaxed">
                {currentCard.back}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 rounded-b-3xl">
          {!isFlipped ? (
            <div className="flex items-center justify-center py-4 text-slate-500 font-semibold tracking-wide">
              Pressione ESPAÇO ou CLIQUE para revelar a resposta
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                disabled={isSubmitting}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRateCard(1);
                }}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 font-bold shadow-sm"
              >
                Errei
                <span className="text-xs mt-1 text-red-600 opacity-80">
                  Tecla 1
                </span>
              </button>
              <button
                disabled={isSubmitting}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRateCard(2);
                }}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold shadow-sm"
              >
                Difícil
                <span className="text-xs mt-1 text-orange-600 opacity-80">
                  Tecla 2
                </span>
              </button>
              <button
                disabled={isSubmitting}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRateCard(3);
                }}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-green-100 hover:bg-green-200 text-green-800 font-bold shadow-sm"
              >
                Bom
                <span className="text-xs mt-1 text-green-600 opacity-80">
                  Tecla 3
                </span>
              </button>
              <button
                disabled={isSubmitting}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRateCard(4);
                }}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold shadow-sm"
              >
                Fácil
                <span className="text-xs mt-1 text-blue-600 opacity-80">
                  Tecla 4
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
