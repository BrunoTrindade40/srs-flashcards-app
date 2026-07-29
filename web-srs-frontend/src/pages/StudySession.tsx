import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import React, { useCallback, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { useDailyReviewTracker } from "../hooks/useDailyReviewTracker";
import { useStudyKeyboard } from "../hooks/useStudyKeyboard";
import { useToast } from "../hooks/useToast";
import { GET_MY_DECKS } from "../lib/graphql/deck";
import { GET_ME } from "../lib/graphql/settings";
import { GET_DUE_FLASHCARDS, SUBMIT_REVIEW } from "../lib/graphql/study";

export const StudySession: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const client = useApolloClient();
  const { showToast } = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const flipTimeRef = useRef<number>(0);

  const { data: dataMe } = useQuery(GET_ME, { fetchPolicy: "cache-first" });
  const userStats = dataMe?.me;

  const { todayReviewCount, incrementReviewCount } = useDailyReviewTracker(
    userStats?.id ?? null,
  );

  const hasReachedDailyLimit = userStats?.maxDailyReviews
    ? todayReviewCount >= userStats.maxDailyReviews
    : false;

  const { data, loading, error } = useQuery(GET_DUE_FLASHCARDS, {
    variables: { deckId: deckId || "" },
    skip: !deckId,
    fetchPolicy: "network-only",
  });

  const [submitReview, { loading: submitting }] = useMutation(SUBMIT_REVIEW);

  const cards = data?.dueFlashcards || [];
  const currentCard = cards[currentIndex];

  // 🔵 PRÉ-FETCHING: Prepara a referência do próximo cartão
  const nextCard =
    currentIndex + 1 < cards.length ? cards[currentIndex + 1] : null;

  const handleShowAnswer = useCallback(() => {
    setIsFlipped(true);
    flipTimeRef.current = Date.now();
  }, []);

  const handleRating = async (rating: number) => {
    if (!currentCard || submitting || !isFlipped) return;

    const reviewDurationMs = Date.now() - flipTimeRef.current;

    try {
      await submitReview({
        variables: {
          flashcardId: currentCard.id,
          rating,
          reviewDurationMs,
        },
      });

      incrementReviewCount();
      setIsFlipped(false);
      flipTimeRef.current = 0;

      if (currentIndex + 1 < cards.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        await Promise.all([
          client.query({ query: GET_ME, fetchPolicy: "network-only" }),
          client.query({ query: GET_MY_DECKS, fetchPolicy: "network-only" }),
        ]);

        showToast(
          "Brilhante! XP e Ofensiva atualizados com sucesso.",
          "success",
        );
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro ao registrar revisão: ${err.message}`, "error");
      }
    }
  };

  useStudyKeyboard({
    showAnswer: isFlipped,
    onShowAnswer: handleShowAnswer,
    onRate: handleRating,
    disabled: loading || submitting || !currentCard,
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-950 gap-4">
        <div className="text-amber-500 text-4xl animate-pulse">🧠</div>
        <div className="text-slate-400 font-medium text-sm animate-pulse tracking-wider uppercase">
          Preparando seu ambiente de foco...
        </div>
      </div>
    );
  }

  if (hasReachedDailyLimit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-950 gap-5 p-4 text-center animate-fadeIn">
        <span className="text-6xl drop-shadow-2xl mb-2">🛑</span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-rose-500">
          Consolidação Cognitiva Atingida
        </h2>
        <p className="text-slate-400 max-w-md leading-relaxed">
          Você atingiu sua trava de segurança de{" "}
          <b>{userStats?.maxDailyReviews} revisões hoje</b>. Continuar forçando
          o algoritmo agora causará o <i>Efeito Bola de Neve</i>. O aprendizado
          de longo prazo exige que você durma para consolidar. Retorne amanhã!
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-6 px-8 py-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold rounded-xl hover:bg-rose-500/20 transition-all shadow-lg cursor-pointer"
        >
          Voltar ao Painel
        </button>
      </div>
    );
  }

  if (error || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-950 gap-5 p-4 text-center animate-fadeIn">
        <span className="text-6xl drop-shadow-2xl mb-2">🏆</span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
          Você está em dia!
        </h2>
        <p className="text-slate-400 max-w-md leading-relaxed">
          Você dominou todos os cartões pendentes deste baralho para hoje.
          Excelente trabalho! Agora, descanse e permita que seu cérebro
          consolide essas memórias.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-6 px-8 py-3 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          Voltar ao Painel
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center py-8 px-4 relative overflow-hidden">
      <div className="flex flex-col items-center w-full max-w-3xl mx-auto gap-6 z-10">
        <div className="flex justify-between items-center w-full text-slate-400 text-sm font-semibold">
          <span>
            Cartão {currentIndex + 1} de {cards.length}
          </span>
          <button
            onClick={() => navigate("/dashboard")}
            className="hover:text-slate-200 transition-colors cursor-pointer"
          >
            Encerrar Sessão
          </button>
        </div>

        <div className="flex flex-col w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 min-h-80 justify-between gap-6 transition-all">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
              Pergunta
            </span>
            <MarkdownRenderer content={currentCard.front ?? ""} />
          </div>

          {isFlipped && (
            <div className="flex flex-col gap-4 border-t border-slate-800 pt-6 animate-fadeIn">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                  Resposta
                </span>
                <MarkdownRenderer content={currentCard.back ?? ""} />
              </div>

              {currentCard.sourceContext && (
                <div className="flex flex-col gap-1 bg-slate-950 p-3 rounded border border-slate-800/60 mt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Contexto de Origem
                  </span>
                  <p className="text-xs text-slate-400 italic">
                    {currentCard.sourceContext}
                  </p>
                </div>
              )}
            </div>
          )}

          {!isFlipped && (
            <button
              onClick={handleShowAnswer}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-xl transition-all border border-slate-700 mt-4 cursor-pointer flex items-center justify-center gap-3"
            >
              <span>Mostrar Resposta</span>
              <kbd className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-md text-[10px] font-mono text-slate-400 uppercase tracking-wider shadow-inner">
                Espaço
              </kbd>
            </button>
          )}
        </div>

        {isFlipped && (
          <div className="flex flex-wrap md:flex-nowrap w-full gap-3 animate-fadeIn">
            <button
              disabled={submitting}
              onClick={() => handleRating(1)}
              className="flex-1 py-3 bg-red-900/40 hover:bg-red-900/60 text-red-200 border border-red-800/50 font-bold rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Errei</span>
              <kbd className="px-2 py-0.5 bg-red-950/80 border border-red-800/60 rounded text-[10px] font-mono text-red-400 shadow-inner">
                1
              </kbd>
            </button>
            <button
              disabled={submitting}
              onClick={() => handleRating(2)}
              className="flex-1 py-3 bg-amber-900/40 hover:bg-amber-900/60 text-amber-200 border border-amber-800/50 font-bold rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Difícil</span>
              <kbd className="px-2 py-0.5 bg-amber-950/80 border border-amber-800/60 rounded text-[10px] font-mono text-amber-400 shadow-inner">
                2
              </kbd>
            </button>
            <button
              disabled={submitting}
              onClick={() => handleRating(3)}
              className="flex-1 py-3 bg-blue-900/40 hover:bg-blue-900/60 text-blue-200 border border-blue-800/50 font-bold rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Bom</span>
              <kbd className="px-2 py-0.5 bg-blue-950/80 border border-blue-800/60 rounded text-[10px] font-mono text-blue-400 shadow-inner">
                3
              </kbd>
            </button>
            <button
              disabled={submitting}
              onClick={() => handleRating(4)}
              className="flex-1 py-3 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-800/50 font-bold rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Fácil</span>
              <kbd className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-800/60 rounded text-[10px] font-mono text-emerald-400 shadow-inner">
                4
              </kbd>
            </button>
          </div>
        )}
      </div>

      {/* 🔵 GHOST PRE-FETCHING:
          Força o React a calcular a Árvore Sintática Abstrata (AST) do LaTeX
          do próximo cartão em Background (invisível e inacessível por leitores de tela),
          anulando a latência de renderização.
      */}
      {nextCard && (
        <div
          aria-hidden="true"
          className="absolute opacity-0 pointer-events-none -z-50 select-none"
        >
          <MarkdownRenderer content={nextCard.front ?? ""} />
          <MarkdownRenderer content={nextCard.back ?? ""} />
        </div>
      )}
    </div>
  );
};
