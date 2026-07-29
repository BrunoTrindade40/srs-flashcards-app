import { useMutation, useQuery } from "@apollo/client/react"; // Importação estrita
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ConfirmModal } from "../components/ConfirmModal";
import { CreateFlashcardModal } from "../components/CreateFlashcardModal";
import { EditDeckModal } from "../components/EditDeckModal";
import { EditFlashcardModal } from "../components/EditFlashcardModal";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { useToast } from "../hooks/useToast";
import { GET_DECK_DETAILS } from "../lib/graphql/deck";
import { REMOVE_FLASHCARD, UPDATE_FLASHCARD } from "../lib/graphql/flashcard";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export const DeckDetails: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditDeckOpen, setIsEditDeckOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  const { data, loading, error } = useQuery(GET_DECK_DETAILS, {
    variables: { id: deckId || "" },
    skip: !deckId,
    fetchPolicy: "network-only",
  });

  const [removeFlashcard] = useMutation(REMOVE_FLASHCARD);
  const [updateFlashcard] = useMutation(UPDATE_FLASHCARD);

  useEffect(() => {
    if (error) {
      showToast(`Erro ao carregar detalhes do deck: ${error.message}`, "error");
    }
  }, [error, showToast]);

  const handleSaveEdit = async (front: string, back: string) => {
    if (!editingCard) return;
    try {
      await updateFlashcard({
        variables: { data: { id: editingCard.id, front, back } },
      });
      showToast("Cartão atualizado com sucesso!", "success");
      setEditingCard(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro ao atualizar cartão: ${err.message}`, "error");
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCardId) return;
    try {
      await removeFlashcard({
        variables: { id: deletingCardId },
        update(cache) {
          const normalizedId = cache.identify({
            id: deletingCardId,
            __typename: "Flashcard",
          });
          cache.evict({ id: normalizedId });
          cache.gc(); // Purga o card da memória RAM instantaneamente
        },
      });
      showToast("Flashcard removido do baralho.", "success");
      setDeletingCardId(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro ao deletar cartão: ${err.message}`, "error");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="text-amber-500 font-bold animate-pulse text-lg">
          Carregando detalhes do deck...
        </div>
      </div>
    );
  }

  if (!deckId || error || !data?.deck) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-6 text-center">
        <h2 className="text-xl font-bold text-red-400">
          Erro ao carregar baralho.
        </h2>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  const deck = data.deck;

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto gap-6 p-6">
      {/* 📍 EIXO Y: Link posicionado exatamente abaixo do Header e acima do Título */}
      <div className="flex items-center w-full">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors bg-slate-900/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800"
        >
          <span>← Voltar ao Dashboard</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-extrabold text-slate-100">
              {deck.title}
            </h1>
            <button
              onClick={() => setIsEditDeckOpen(true)}
              className="px-3 py-1 text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
            >
              ✏️ Editar
            </button>
          </div>
          <p className="text-slate-400 text-sm">
            {deck.description || "Sem descrição."}
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => navigate(`/study/${deck.id}`)}
            className="flex-1 md:flex-none px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 transition-colors cursor-pointer"
          >
            Iniciar Estudo ⚡
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 md:flex-none px-5 py-2.5 bg-slate-800 text-slate-100 font-bold rounded-lg hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
          >
            + Criar Card
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-slate-300">
          Cartões no Baralho ({deck.flashcards?.length || 0})
        </h2>

        {!deck.flashcards || deck.flashcards.length === 0 ? (
          <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-500">
            Nenhum cartão cadastrado neste baralho ainda.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {deck.flashcards.map((card: Flashcard) => (
              <div
                key={card.id}
                className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-5 rounded-xl gap-4 hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col md:flex-row flex-1 gap-6 w-full overflow-hidden">
                  <div className="flex flex-col flex-1 gap-1 min-w-0">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                      Frente
                    </span>
                    <MarkdownRenderer content={card.front ?? ""} />
                  </div>

                  <div className="flex flex-col flex-1 gap-1 min-w-0 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                      Verso
                    </span>
                    <MarkdownRenderer content={card.back ?? ""} />
                  </div>
                </div>

                <div className="flex gap-2 self-end md:self-center border-t md:border-t-0 border-slate-800/80 pt-3 md:pt-0 w-full md:w-auto justify-end">
                  <button
                    onClick={() =>
                      setEditingCard({
                        id: card.id,
                        front: card.front,
                        back: card.back,
                      })
                    }
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeletingCardId(card.id)}
                    className="px-3 py-1.5 text-xs font-semibold bg-red-950/40 text-red-300 hover:bg-red-900/60 rounded border border-red-900/50 transition-colors cursor-pointer"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateFlashcardModal
        deckId={deck.id}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
      {editingCard && (
        <EditFlashcardModal
          isOpen={true}
          initialFront={editingCard.front}
          initialBack={editingCard.back}
          onClose={() => setEditingCard(null)}
          onSave={handleSaveEdit}
        />
      )}
      <EditDeckModal
        deck={deck}
        isOpen={isEditDeckOpen}
        onClose={() => setIsEditDeckOpen(false)}
      />
      <ConfirmModal
        isOpen={!!deletingCardId}
        title="Excluir Flashcard"
        message="Tem certeza que deseja remover este cartão do baralho?"
        onClose={() => setDeletingCardId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
