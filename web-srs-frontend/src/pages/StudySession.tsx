import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { useStudyEngine } from "../hooks/useStudyEngine";
import { useStudyKeyboard } from "../hooks/useStudyKeyboard";

export const StudySession: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const safeDeckId = deckId ?? null;

  const {
    currentCard,
    nextCard,
    currentIndex,
    totalCards,
    isFlipped,
    loading,
    error,
    submitting,
    hasReachedDailyLimit,
    maxDailyReviews,
    handleShowAnswer,
    handleRating,
    handleExit,
  } = useStudyEngine(safeDeckId);

  useStudyKeyboard({
    showAnswer: isFlipped,
    onShowAnswer: handleShowAnswer,
    onRate: handleRating,
    onExit: handleExit,
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

  const isSessionExhausted = !currentCard || totalCards === 0;

  if (error || isSessionExhausted) {
    if (hasReachedDailyLimit) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-950 gap-5 p-4 text-center animate-fadeIn">
          <span className="text-6xl drop-shadow-2xl mb-2">🛑</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-rose-500">
            Consolidação Cognitiva Atingida
          </h2>
          <p className="text-slate-400 max-w-md leading-relaxed">
            Você atingiu sua trava de segurança de <b>{maxDailyReviews} revisões hoje</b> e esgotou suas pendências imediatas.
            Continuar forçando a aquisição de novos conceitos causará o <i>Efeito Bola de Neve</i>.
            O aprendizado de longo prazo exige que você durma para consolidar. Retorne amanhã!
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
            Cartão {currentIndex + 1} de {totalCards}
          </span>
          <button
            onClick={handleExit}
            className="hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-2"
          >
            <span>Encerrar Sessão</span>
            <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-[9px] font-mono text-slate-400 shadow-inner tracking-wider">
              ESC
            </kbd>
          </button>
        </div>

        <div className="flex flex-col w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 min-h-80 justify-between gap-6 transition-all">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
              Pergunta
            </span>
            <MarkdownRenderer content={currentCard?.frontContent ?? ""} />
          </div>

          {isFlipped && (
            <div className="flex flex-col gap-4 border-t border-slate-800 pt-6 animate-fadeIn">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                  Resposta
                </span>
                <MarkdownRenderer content={currentCard?.backContent ?? ""} />
              </div>

              {currentCard?.sourceContext && (
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
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-md text-[10px] font-mono text-slate-400 uppercase tracking-wider shadow-inner">
                  Espaço
                </kbd>
                <span className="text-slate-500 text-[10px] font-bold lowercase">ou</span>
                <kbd className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-md text-[10px] font-mono text-slate-400 uppercase tracking-wider shadow-inner">
                  Enter
                </kbd>
              </div>
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

      {/* 🟢 CORREÇÃO (Isolamento de Ghost Pre-fetching):
          Apenas a face frontal ('front') do próximo cartão é pré-renderizada para aquecimento de cache/assets.
          A renderização do verso ('back') foi omitida do DOM invisível para impedir vazamentos 
          de resposta em leitores de tela (Acessibilidade) e extensões do navegador. */}
      {nextCard && (
        <div
          aria-hidden="true"
          className="absolute opacity-0 pointer-events-none -z-50 select-none"
        >
          <MarkdownRenderer content={nextCard?.frontContent ?? ""} />
        </div>
      )}
    </div>
  );
};