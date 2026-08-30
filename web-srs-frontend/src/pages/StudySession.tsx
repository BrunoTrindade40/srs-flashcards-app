import React, { Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { StudyHeader } from "../components/StudyHeader";
import { StudyCard } from "../components/StudyCard";
import { StudyControls } from "../components/StudyControls";
import { useStudyEngine } from "../hooks/useStudyEngine";
import { useStudyKeyboard } from "../hooks/useStudyKeyboard";

const StudySessionCore: React.FC<{ deckId: string }> = ({ deckId }) => {
  const navigate = useNavigate();
  
  // REGRA DE SUSPENSE APLICADA (FIM DOS FLAGS DE LOADING):
  // O componente renderizará SOMENTE quando o hook 'useStudyEngine'
  // já tiver os dados consolidados ou ejetar um erro.
  const {
    currentCard,
    nextCard,
    totalCards,
    isFlipped,
    handleShowAnswer,
    handleRating,
    handleExit,
  } = useStudyEngine(deckId);

  useStudyKeyboard({
    showAnswer: isFlipped,
    onShowAnswer: handleShowAnswer,
    onRate: handleRating,
    onExit: handleExit,
    // Bloqueio mantido apenas caso a fila caia a zero e currentCard torne-se null
    disabled: !currentCard,
  });

  const isSessionExhausted = !currentCard || totalCards === 0;

  // CORREÇÃO: A condicional abandona o lixo estático e atua puramente no esgotamento cognitivo
  if (isSessionExhausted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-950 gap-5 p-4 text-center animate-fadeIn">
        <span className="text-6xl drop-shadow-2xl mb-2"></span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
          Você está em dia!
        </h2>
        <p className="text-slate-400 max-w-md leading-relaxed">
          Você dominou todos os cartões atrasados ou atingiu sua cota de retenção segura para hoje.
          Excelente trabalho! Agora, descanse e permita que seu cérebro consolide essas memórias.
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
        <StudyHeader totalCards={totalCards} onExit={handleExit} />
        <StudyCard
          frontContent={currentCard.frontContent}
          backContent={currentCard.backContent}
          sourceContext={currentCard.sourceContext}
          isFlipped={isFlipped}
          onShowAnswer={handleShowAnswer}
        />
        {isFlipped && <StudyControls onRate={handleRating} />}
      </div>
      {nextCard && (
        <div aria-hidden="true" className="absolute opacity-0 pointer-events-none -z-50 select-none">
          <MarkdownRenderer content={nextCard.frontContent} />
        </div>
      )}
    </div>
  );
};

export const StudySession: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const resolvedDeckId = deckId ?? "";

  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-950 gap-4">
          <div className="text-amber-500 text-4xl animate-pulse"></div>
          <div className="text-slate-400 font-medium text-sm animate-pulse tracking-wider uppercase">
            Sincronizando Rede Neural...
          </div>
        </div>
      }
    >
      <StudySessionCore deckId={resolvedDeckId} />
    </Suspense>
  );
};