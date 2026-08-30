import React, { useCallback } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import type { EditingCardState } from "../hooks/useDeckDetails";

interface FlashcardItemProps {
  id: string;
  frontContent: string;
  backContent: string;
  sourceContext?: string | null;
  onEdit: (card: EditingCardState) => void;
  onDelete: (id: string) => void;
}

const FlashcardListItem: React.FC<FlashcardItemProps> = React.memo(
  ({ id, frontContent, backContent, sourceContext, onEdit, onDelete }) => {
    const handleEdit = useCallback(() => {
      onEdit({ id, frontContent, backContent, sourceContext });
    }, [id, frontContent, backContent, sourceContext, onEdit]);

    const handleDelete = useCallback(() => {
      onDelete(id);
    }, [id, onDelete]);

    return (
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-5 rounded-xl gap-4 hover:border-slate-700 transition-all shadow-sm">
        <div className="flex flex-col md:flex-row flex-1 gap-6 w-full overflow-hidden">
          <div className="flex flex-col flex-1 gap-1 min-w-0">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
              Frente
            </span>
            <MarkdownRenderer
              content={frontContent}
              className="text-slate-300 prose-invert prose-amber [&_.katex]:text-slate-200"
            />
          </div>
          <div className="flex flex-col flex-1 gap-1 min-w-0 border-t md:border-t-0 md:border-l border-slate-800/50 pt-3 md:pt-0 md:pl-6">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
              Verso
            </span>
            <MarkdownRenderer
              content={backContent}
              className="text-slate-300 prose-invert prose-amber [&_.katex]:text-slate-200"
            />
          </div>
        </div>

        <div className="flex gap-2 self-end md:self-center border-t md:border-t-0 border-slate-800/50 pt-3 md:pt-0 w-full md:w-auto justify-end">
          <button
            onClick={handleEdit}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100 rounded border border-slate-700 transition-colors cursor-pointer shadow-sm"
          >
            Editar
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-xs font-semibold bg-rose-950/30 text-rose-400 hover:bg-rose-900/50 hover:text-rose-300 rounded border border-rose-900/50 transition-colors cursor-pointer shadow-sm"
          >
            Excluir
          </button>
        </div>
      </div>
    );
  },
);

// ==============================================================================
// Componente Pai Orquestrador
// ==============================================================================
interface FlashcardListProps {
  flashcards: Array<{
    id: string;
    frontContent: string;
    backContent: string;
    sourceContext?: string | null;
  }>;
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
      <h2 className="text-lg font-bold text-slate-100">
        Cartões no Baralho ({flashcards.length})
      </h2>

      {!hasCards ? (
        <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-xl text-center text-slate-400 flex items-center justify-center shadow-sm">
          <span>Nenhum cartão cadastrado neste baralho ainda.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {flashcards.map((card) => (
            <FlashcardListItem
              key={card.id}
              id={card.id}
              frontContent={card.frontContent}
              backContent={card.backContent}
              sourceContext={card.sourceContext}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-4 w-full">
              <button
                onClick={onLoadMore}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-colors cursor-pointer border border-slate-700 shadow-sm flex items-center justify-center gap-2"
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
