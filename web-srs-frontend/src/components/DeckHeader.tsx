import { useNavigate } from "react-router-dom";

interface DeckHeaderProps {
  deckId: string;
  title: string;
  description: string | null;
  isArchived: boolean;
  flashcardsCount: number;
  onToggleArchive: () => void;
  onEditDeck: () => void;
  onDeleteDeck: () => void;
  onCreateCard: () => void;
}

export const DeckHeader = ({
  deckId,
  title,
  description,
  isArchived,
  flashcardsCount,
  onToggleArchive,
  onEditDeck,
  onDeleteDeck,
  onCreateCard,
}: DeckHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 gap-4">
      <div className="flex flex-col gap-2 w-full md:w-auto">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-extrabold text-slate-100">{title}</h1>

          {isArchived && (
            <span className="bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border border-slate-700">
              Arquivado
            </span>
          )}

          <div className="flex flex-wrap gap-2 md:ml-2 mt-2 md:mt-0">
            <button
              onClick={onToggleArchive}
              className="px-3 py-1 text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100 rounded border border-slate-700 transition-colors cursor-pointer shadow-sm"
            >
              {isArchived ? "Desarquivar" : "Arquivar"}
            </button>
            <button
              onClick={onEditDeck}
              className="px-3 py-1 text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100 rounded border border-slate-700 transition-colors cursor-pointer shadow-sm"
            >
              Editar
            </button>
            <button
              onClick={onDeleteDeck}
              className="px-3 py-1 text-xs font-semibold bg-rose-950/30 text-rose-400 hover:bg-rose-900/50 hover:text-rose-300 rounded border border-rose-900/50 transition-colors cursor-pointer shadow-sm"
            >
              Excluir
            </button>
          </div>
        </div>
        <p className="text-slate-400 text-sm">
          {description || "Sem descrição."}
        </p>
      </div>

      <div className="flex gap-3 w-full md:w-auto">
        <button
          onClick={() => navigate(`/study/${deckId}`)}
          disabled={flashcardsCount === 0}
          className="flex-1 md:flex-none px-5 py-2.5 font-bold rounded-lg transition-colors shadow-md bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer disabled:opacity-50"
        >
          Iniciar Estudo
        </button>
        <button
          onClick={onCreateCard}
          className="flex-1 md:flex-none px-5 py-2.5 bg-slate-800 text-slate-200 font-bold rounded-lg hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer shadow-sm"
        >
          + Criar Card
        </button>
      </div>
    </div>
  );
};
