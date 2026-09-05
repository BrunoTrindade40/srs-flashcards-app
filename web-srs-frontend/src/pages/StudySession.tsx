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
  const {
    currentCard,
    nextCard,
    totalCards,
    isFlipped,
    handleShowAnswer,
    handleRating,
    handleExit,
  } = useStudyEngine(deckId);

  // Delegação do rastreio de teclado com proteção via Guard Clause
  useStudyKeyboard({
    showAnswer: isFlipped,
    onShowAnswer: handleShowAnswer,
    onRate: handleRating,
    onExit: handleExit,
    disabled: currentCard === null, // Refatorado para booleano absoluto
  });

  const isSessionExhausted = currentCard === null || totalCards === 0;

  // Inversão de Controle Arquitetural (Padrão DRY e Flexbox)
  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-950">
      <StudyHeader
        totalCards={isSessionExhausted ? 0 : totalCards}
        onExit={handleExit}
      />
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {isSessionExhausted ? (
          <div className="flex flex-col items-center text-center gap-5 animate-fadeIn">
            <span className="text-6xl drop-shadow-2xl mb-2">🎉</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Você está em dia!
            </h2>
            <p className="text-slate-400 max-w-md leading-relaxed">
              Você dominou todos os cartões atrasados ou atingiu sua cota de
              retenção segura para hoje. Excelente trabalho! Agora, descanse e
              permita que seu cérebro consolide essas memórias.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-6 px-8 py-3 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Voltar ao Painel
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full max-w-3xl mx-auto gap-6 z-10">
            <StudyCard
              frontContent={currentCard?.frontContent ?? ""}
              backContent={currentCard?.backContent ?? ""}
              sourceContext={currentCard?.sourceContext ?? null}
              isFlipped={isFlipped}
              onShowAnswer={handleShowAnswer}
            />
            {/* isFlipped é tipado como boolean strict, portanto a avaliação é segura */}
            {isFlipped && <StudyControls onRate={handleRating} />}
          </div>
        )}

        {/* 
          ALERTA CORRIGIDO: Aplicação do Padrão Booleano Absoluto.
          A validação explícita 'nextCard !== null' blinda o JSX contra vazamento 
          da referência do objeto no React 19 e assegura o Type Guard do TypeScript 
          para o acesso subsequente a 'nextCard.frontContent'.
        */}
        {isSessionExhausted === false && nextCard !== null && (
          <div
            aria-hidden="true"
            className="absolute opacity-0 pointer-events-none -z-50 select-none"
          >
            <MarkdownRenderer content={nextCard.frontContent} />
          </div>
        )}
      </main>
    </div>
  );
};

export const StudySession: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  // Asserção de fallback seguro sem Non-null Assertion (!)
  const resolvedDeckId = deckId ?? "";

  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-950 gap-4">
          <div className="text-amber-500 text-4xl animate-pulse">🧠</div>
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
