import React from "react";
import { useNavigate } from "react-router-dom";
import type { DeckItem } from "../hooks/useDashboard";

interface DashboardDeckListProps {
  activeDecks: DeckItem[];
  archivedDecks: DeckItem[];
  onCreateDeck: () => void;
}

export const DashboardDeckList: React.FC<DashboardDeckListProps> = ({
  activeDecks,
  archivedDecks,
  onCreateDeck,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Seus Baralhos</h2>
        </div>

        {activeDecks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white/50 border border-slate-200 rounded-2xl text-center gap-4">
            <span className="text-4xl">🌱</span>
            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="text-base font-bold text-slate-700">
                Nenhum baralho ativo encontrado
              </h3>
              <p className="text-xs text-slate-500">
                Crie seu primeiro baralho temático para começar a adicionar
                flashcards e iniciar suas sessões de estudo.
              </p>
            </div>
            <button
              onClick={onCreateDeck}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer mt-2"
            >
              + Criar Primeiro Baralho
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeDecks.map((deck) => {
              const cardCount = deck.flashcards?.length ?? 0;
              return (
                <div
                  key={deck.id}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-slate-200 p-5 rounded-2xl gap-4 hover:border-slate-300 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-800">
                        {deck.title}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-full">
                        {cardCount} {cardCount === 1 ? "card" : "cards"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {deck.description || "Sem descrição informada."}
                    </p>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto justify-end">
                    <button
                      onClick={() => navigate(`/deck/${deck.id}`)}
                      className="flex-1 md:flex-none px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer shadow-sm"
                    >
                      Ver Detalhes
                    </button>
                    <button
                      onClick={() => navigate(`/study/${deck.id}`)}
                      disabled={cardCount === 0}
                      className="flex-1 md:flex-none px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Estudar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {archivedDecks.length > 0 && (
        <div className="flex flex-col gap-3 pt-4 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Baralhos Arquivados ({archivedDecks.length})
          </h3>
          <div className="flex flex-col gap-2">
            {archivedDecks.map((deck) => (
              <div
                key={deck.id}
                className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-xl gap-4"
              >
                <span className="text-sm font-semibold text-slate-600">
                  {deck.title}
                </span>
                <button
                  onClick={() => navigate(`/deck/${deck.id}`)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 transition-all cursor-pointer shadow-sm"
                >
                  Gerenciar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};