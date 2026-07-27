import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Importado useNavigate
import { useStudyKeyboard } from "../hooks/useStudyKeyboard";
import { useToast } from "../hooks/useToast";
import {
  GET_CHAOS_STUDY_QUEUE,
  SUBMIT_REVIEW,
  type FlashcardDue,
} from "../lib/graphql/study";

export function ChaosStudyPage() {
  const navigate = useNavigate(); // Instanciado o roteador defensivo
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [answerShownAt, setAnswerShownAt] = useState<number | null>(null);
  const { showToast } = useToast();

  const { data, loading, error, refetch } = useQuery(GET_CHAOS_STUDY_QUEUE, {
    variables: { limit: 50 },
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (error) {
      showToast(`Erro ao sincronizar Modo Chaos: ${error.message}`, "error");
    }
  }, [error, showToast]);

  const [submitReview, { loading: submitting }] = useMutation(SUBMIT_REVIEW);

  const cards = (data?.chaosStudyQueue as FlashcardDue[]) || [];
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
        if (err instanceof Error) {
          console.error("Erro crítico na avaliação FSRS Chaos:", err.message);
          showToast(`Sessão abortada: ${err.message}`, "error");
        } else {
          console.error("Erro desconhecido na avaliação:", err);
          showToast("Falha inesperada de comunicação.", "error");
        }

        // Bloqueio ativo: Impede avanço manual sobre dados não computados
        navigate("/dashboard", { replace: true });
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
      navigate, // Adicionado ao array de dependências
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">
            Carregando cartas do Modo Chaos...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-rose-400 font-medium text-center">
          Erro ao carregar a sessão Chaos.
        </p>
        <button
          onClick={() => refetch()}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition cursor-pointer shadow-md"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (cards.length === 0 || sessionFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-3xl mb-2 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          ⚡
        </div>
        <h2 className="text-2xl font-bold text-slate-100">
          Sessão Chaos Concluída!
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Você revisou todas as cartas intercaladas que estavam agendadas para o
          momento atual.
        </p>
        <Link
          to="/dashboard"
          className="mt-4 px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg hover:shadow-amber-500/20"
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
        <div className="flex flex-col items-start gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 shadow-sm">
            Modo Chaos (Interleaving)
          </span>
          <h1 className="text-lg font-bold text-slate-200 line-clamp-1">
            Deck: {currentCard.deck?.title || "Geral"}
          </h1>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs text-slate-400 block mb-1">Progresso</span>
          <p className="text-sm font-semibold text-slate-200">
            {currentIndex + 1} / {cards.length}
          </p>
        </div>
      </div>

      {/* Visualizador do Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-65 flex flex-col justify-between shadow-lg">
        <div className="flex flex-col gap-4">
          {/* Contexto da Referência (Renderização Condicional em Flexbox) */}
          {currentCard.sourceContext && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 w-fit self-start">
              <span className="text-amber-500 text-xs">📖</span>
              <cite className="text-[10px] text-slate-400 font-medium uppercase tracking-wider not-italic">
                {currentCard.sourceContext}
              </cite>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Frente (Pergunta)
            </span>
            <div className="text-lg text-slate-100 font-medium whitespace-pre-wrap">
              {currentCard.front}
            </div>
          </div>

          {/* Multimídia via Flexbox Puro (KISS: HTML5 Nativo) */}
          {(currentCard.imageUrl || currentCard.audioUrl) && (
            <div className="flex flex-col gap-3 mt-2 border-t border-slate-800/50 pt-4">
              {currentCard.imageUrl && (
                <div className="flex justify-center w-full bg-slate-950/50 rounded-xl border border-slate-800 p-2">
                  <img
                    src={currentCard.imageUrl}
                    alt="Contexto visual do flashcard"
                    loading="lazy"
                    className="max-h-56 w-auto object-contain rounded-lg"
                  />
                </div>
              )}
              {currentCard.audioUrl && (
                <audio
                  key={`audio-${currentCard.id}`} /* Previne colisão de estado no React */
                  controls
                  className="w-full h-10 rounded-lg outline-none"
                  src={currentCard.audioUrl}
                  preload="none"
                >
                  Seu navegador não suporta o formato de áudio.
                </audio>
              )}
            </div>
          )}
        </div>

        {/* Verso (Resposta) */}
        {showAnswer ? (
          <div className="flex flex-col gap-2 pt-6 border-t border-slate-800/80 mt-6 animate-fade-in">
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
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm transition border border-slate-700/50 cursor-pointer"
            >
              Revelar Resposta (Espaço / Enter)
            </button>
          </div>
        )}
      </div>

      {/* Botões de Avaliação (FSRS Flexbox) */}
      {showAnswer && (
        <div className="flex flex-wrap w-full gap-3 pt-2">
          <button
            onClick={() => handleRating(1)}
            disabled={submitting}
            className="flex-1 min-w-[calc(50%-0.375rem)] sm:min-w-0 flex flex-col items-center justify-center p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <span className="font-bold text-sm">Errei</span>
            <span className="text-[10px] text-rose-400/70 mt-1 uppercase tracking-wider">
              Teclado: 1
            </span>
          </button>
          <button
            onClick={() => handleRating(2)}
            disabled={submitting}
            className="flex-1 min-w-[calc(50%-0.375rem)] sm:min-w-0 flex flex-col items-center justify-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <span className="font-bold text-sm">Difícil</span>
            <span className="text-[10px] text-amber-400/70 mt-1 uppercase tracking-wider">
              Teclado: 2
            </span>
          </button>
          <button
            onClick={() => handleRating(3)}
            disabled={submitting}
            className="flex-1 min-w-[calc(50%-0.375rem)] sm:min-w-0 flex flex-col items-center justify-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <span className="font-bold text-sm">Bom</span>
            <span className="text-[10px] text-blue-400/70 mt-1 uppercase tracking-wider">
              Teclado: 3
            </span>
          </button>
          <button
            onClick={() => handleRating(4)}
            disabled={submitting}
            className="flex-1 min-w-[calc(50%-0.375rem)] sm:min-w-0 flex flex-col items-center justify-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <span className="font-bold text-sm">Fácil</span>
            <span className="text-[10px] text-emerald-400/70 mt-1 uppercase tracking-wider">
              Teclado: 4
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ChaosStudyPage;
