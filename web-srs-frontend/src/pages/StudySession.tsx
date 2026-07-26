import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStudyKeyboard } from "../hooks/useStudyKeyboard";
import { useToast } from "../hooks/useToast";
import {
  GET_DUE_FLASHCARDS,
  SUBMIT_REVIEW,
  type FlashcardDue,
} from "../lib/graphql/study";

export function StudySession() {
  const { deckId } = useParams<{ deckId: string }>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [answerShownAt, setAnswerShownAt] = useState<number | null>(null);

  const { showToast } = useToast();

  const { data, loading, error, refetch } = useQuery(GET_DUE_FLASHCARDS, {
    variables: { deckId: deckId || "" },
    skip: !deckId,
    fetchPolicy: "network-only",
  });

  const [submitReview, { loading: submitting }] = useMutation(SUBMIT_REVIEW);

  const cards: FlashcardDue[] = data?.dueFlashcards || [];
  const currentCard = cards[currentIndex];

  const handleRating = useCallback(
    async (rating: number) => {
      if (!currentCard || submitting) return;

      const reviewDurationMs = answerShownAt ? Date.now() - answerShownAt : 0;

      try {
        await submitReview({
          variables: {
            flashcardId: currentCard.id,
            rating,
            reviewDurationMs,
          },
        });

        if (currentIndex + 1 < cards.length) {
          setCurrentIndex((prev) => prev + 1);
          setShowAnswer(false);
          setAnswerShownAt(null);
        } else {
          setSessionFinished(true);
        }
      } catch (err: unknown) {
        console.error("Erro ao registrar avaliação:", err);
        showToast("Falha ao salvar revisão no servidor.", "error");
      }
    },
    [
      currentCard,
      submitting,
      answerShownAt,
      submitReview,
      currentIndex,
      cards.length,
      showToast,
    ],
  );

  const handleShowAnswerClick = useCallback(() => {
    setShowAnswer(true);
    setAnswerShownAt(Date.now());
  }, []);

  useStudyKeyboard({
    showAnswer,
    disabled: sessionFinished || !currentCard || submitting,
    onRevealAnswer: handleShowAnswerClick,
    onRating: handleRating,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400 font-medium">
          Carregando sessão de estudos...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-rose-400 font-medium">
          Erro ao carregar sessão de estudos.
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (cards.length === 0 || sessionFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl mb-2">
          🎉
        </div>
        <h2 className="text-2xl font-bold text-slate-100">
          Sessão Finalizada!
        </h2>
        <p className="text-slate-400 text-sm">
          Você revisou todos os cartões agendados para este baralho no dia de
          hoje.
        </p>
        <Link
          to="/dashboard"
          className="mt-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl text-sm transition"
        >
          Voltar ao Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
            Sessão Padrão
          </span>
          <h1 className="text-lg font-bold text-slate-200 mt-2">
            Deck: {currentCard.deck?.title || "Estudo Diário"}
          </h1>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Progresso</span>
          <p className="text-sm font-semibold text-slate-200">
            {currentIndex + 1} / {cards.length}
          </p>
        </div>
      </div>

      {/* Visualizador do Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-65 flex flex-col justify-between shadow-lg">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Frente (Pergunta)
          </span>
          <div className="text-lg text-slate-100 font-medium whitespace-pre-wrap">
            {currentCard.front}
          </div>
        </div>

        {showAnswer ? (
          <div className="flex flex-col gap-2 pt-6 border-t border-slate-800/80 mt-6">
            <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
              Verso (Resposta)
            </span>
            <div className="text-base text-slate-200 whitespace-pre-wrap">
              {currentCard.back}
            </div>
          </div>
        ) : (
          <div className="pt-6 border-t border-slate-800/50 mt-6 text-center">
            <button
              onClick={handleShowAnswerClick}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm transition border border-slate-700/50"
            >
              Revelar Resposta (Espaço / Enter)
            </button>
          </div>
        )}
      </div>

      {/* Botões de Avaliação (Flexbox) */}
      {showAnswer && (
        <div className="flex flex-wrap w-full gap-3 pt-2">
          <button
            onClick={() => handleRating(1)}
            disabled={submitting}
            className="flex-1 min-w-[calc(50%-0.375rem)] sm:min-w-0 flex flex-col items-center justify-center p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 active:scale-95 transition disabled:opacity-50"
          >
            <span className="font-semibold text-sm">Errei</span>
            <span className="text-xs text-rose-400/70 mt-0.5">Teclado: 1</span>
          </button>
          <button
            onClick={() => handleRating(2)}
            disabled={submitting}
            className="flex-1 min-w-[calc(50%-0.375rem)] sm:min-w-0 flex flex-col items-center justify-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 active:scale-95 transition disabled:opacity-50"
          >
            <span className="font-semibold text-sm">Difícil</span>
            <span className="text-xs text-amber-400/70 mt-0.5">Teclado: 2</span>
          </button>
          <button
            onClick={() => handleRating(3)}
            disabled={submitting}
            className="flex-1 min-w-[calc(50%-0.375rem)] sm:min-w-0 flex flex-col items-center justify-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 active:scale-95 transition disabled:opacity-50"
          >
            <span className="font-semibold text-sm">Bom</span>
            <span className="text-xs text-blue-400/70 mt-0.5">Teclado: 3</span>
          </button>
          <button
            onClick={() => handleRating(4)}
            disabled={submitting}
            className="flex-1 min-w-[calc(50%-0.375rem)] sm:min-w-0 flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 active:scale-95 transition disabled:opacity-50"
          >
            <span className="font-semibold text-sm">Fácil</span>
            <span className="text-xs text-emerald-400/70 mt-0.5">
              Teclado: 4
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export default StudySession;
