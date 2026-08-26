import React from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
// IMPORTAÇÃO CORRIGIDA: Consumindo o tipo atômico gerado pelo Codegen (Fim do "any")
import type { EditingCardState, FlashcardItem } from "../hooks/useDeckDetails";

interface FlashcardListProps {
  flashcards: FlashcardItem[];
  hasMore: boolean;
  onLoadMore: () => void;
  onEditCard: (card: EditingCardState) => void;
  onDeleteCard: (id: string) => void;
}

export const FlashcardList: React.FC<FlashcardListProps> = ({
  flashcards,
  hasMore,
  onLoadMore,
  onEditCard,
  onDeleteCard,
}) => {
  const hasCards = flashcards.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-slate-300">
        Cartões no Baralho ({flashcards.length})
      </h2>

      {!hasCards ? (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-500 flex items-center justify-center">
          <span>Nenhum cartão cadastrado neste baralho ainda.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {flashcards.map((card) => (
            <div
              key={card.id}
              className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-5 rounded-xl gap-4 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col md:flex-row flex-1 gap-6 w-full overflow-hidden">
                <div className="flex flex-col flex-1 gap-1 min-w-0">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                    Frente
                  </span>
                  <MarkdownRenderer content={card.frontContent ?? ""} />
                </div>
                <div className="flex flex-col flex-1 gap-1 min-w-0 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                    Verso
                  </span>
                  <MarkdownRenderer content={card.backContent ?? ""} />
                </div>
              </div>

              <div className="flex gap-2 self-end md:self-center border-t md:border-t-0 border-slate-800/80 pt-3 md:pt-0 w-full md:w-auto justify-end">
                <button
                  onClick={() =>
                    onEditCard({
                      id: card.id,
                      frontContent: card.frontContent,
                      backContent: card.backContent,
                      sourceContext: card.sourceContext,
                    })
                  }
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDeleteCard(card.id)}
                  className="px-3 py-1.5 text-xs font-semibold bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 rounded border border-rose-900/50 transition-colors cursor-pointer"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-4 w-full">
              <button
                onClick={onLoadMore}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors cursor-pointer border border-slate-700 shadow-sm flex items-center justify-center gap-2"
              >
                Carregar Mais Cartões
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};