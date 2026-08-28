import React from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import type { GetDeckDetailsQuery } from "../gql/graphql";
import type { EditingCardState } from "../hooks/useDeckDetails";

type QueryDeck = NonNullable<GetDeckDetailsQuery["deck"]>;
type FlashcardListItem = NonNullable<QueryDeck["flashcards"]>[number];

interface FlashcardListProps {
  flashcards: FlashcardListItem[];
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
  // Extração determinística e booleana pura
  const hasCards = flashcards.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-slate-800">
        Cartões no Baralho ({flashcards.length})
      </h2>

      {!hasCards ? (
        <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 flex items-center justify-center shadow-sm">
          <span>Nenhum cartão cadastrado neste baralho ainda.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {flashcards.map((card) => (
            <div
              key={card.id}
              className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-slate-200 p-5 rounded-xl gap-4 hover:border-slate-300 transition-all shadow-sm"
            >
              <div className="flex flex-col md:flex-row flex-1 gap-6 w-full overflow-hidden">
                <div className="flex flex-col flex-1 gap-1 min-w-0">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Frente</span>
                  <MarkdownRenderer content={card.frontContent} className="text-slate-700 prose-slate" />
                </div>
                <div className="flex flex-col flex-1 gap-1 min-w-0 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Verso</span>
                  <MarkdownRenderer content={card.backContent} className="text-slate-700 prose-slate" />
                </div>
              </div>
              
              <div className="flex gap-2 self-end md:self-center border-t md:border-t-0 border-slate-200 pt-3 md:pt-0 w-full md:w-auto justify-end">
                <button
                  onClick={() =>
                    onEditCard({
                      id: card.id,
                      frontContent: card.frontContent,
                      backContent: card.backContent,
                      sourceContext: card.sourceContext,
                    })
                  }
                  className="px-3 py-1.5 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 rounded border border-slate-300 transition-colors cursor-pointer shadow-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDeleteCard(card.id)}
                  className="px-3 py-1.5 text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 rounded border border-rose-200 transition-colors cursor-pointer shadow-sm"
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
                className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer border border-slate-300 shadow-sm flex items-center justify-center gap-2"
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