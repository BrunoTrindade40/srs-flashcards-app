import React, { useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { ConfirmModal } from "../components/ConfirmModal";
import { CreateFlashcardModal } from "../components/CreateFlashcardModal";
import { EditDeckModal } from "../components/EditDeckModal";
import { EditFlashcardModal } from "../components/EditFlashcardModal";
import { DeckHeader } from "../components/DeckHeader";
import { FlashcardList } from "../components/FlashcardList";
import { useDeckDetails } from "../hooks/useDeckDetails";
import { useToast } from "../hooks/useToast";

export const DeckDetails: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const { showToast } = useToast();

  const resolvedDeckId = deckId ?? "";

  const {
    deck,
    loading,
    error,
    hasMore,
    visibleFlashcards,
    handleLoadMore,
    deletingDeck,
    updatingDeck,
    isCreateOpen,
    setIsCreateOpen,
    isEditDeckOpen,
    setIsEditDeckOpen,
    editingCard,
    setEditingCard,
    deletingCardId,
    setDeletingCardId,
    isDeletingDeck,
    setIsDeletingDeck,
    handleSaveEdit,
    handleConfirmDeleteCard,
    handleConfirmDeleteDeck,
    handleToggleArchive,
  } = useDeckDetails(resolvedDeckId);

  useEffect(() => {
    if (error) {
      showToast(`Erro ao carregar detalhes do deck: ${error.message}`, "error");
    }
  }, [error, showToast]);

  const handleCloseCreateModal = useCallback(() => setIsCreateOpen(false), [setIsCreateOpen]);
  const handleCloseEditCardModal = useCallback(() => setEditingCard(null), [setEditingCard]);
  const handleCloseEditDeckModal = useCallback(() => setIsEditDeckOpen(false), [setIsEditDeckOpen]);
  const handleCloseDeleteCardModal = useCallback(() => setDeletingCardId(null), [setDeletingCardId]);
  const handleCloseDeleteDeckModal = useCallback(() => setIsDeletingDeck(false), [setIsDeletingDeck]);

  if (loading && !deck) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] w-full">
        <div className="text-amber-500 font-bold animate-pulse text-lg">
          Carregando detalhes do deck...
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-6 text-center w-full">
        <h2 className="text-xl font-bold text-rose-500">
          Erro ao carregar baralho.
        </h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto gap-6 p-6 animate-fadeIn">
      <div className="flex items-center w-full">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors bg-slate-900/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800"
        >
          <span>← Voltar ao Dashboard</span>
        </Link>
      </div>

      {/* CORREÇÃO CRÍTICA: Desmontagem Condicional da Estrutura */}
      {/* Somente renderiza a interface complexa quando existe a garantia lógica de 'deck' populado na memória (Resolvido Pelo Early Return acima) */}
      {/* CORREÇÃO: Desmontagem Condicional explícita baseada na existência dos dados */}
      {deck && (
        <DeckHeader
          deckId={deck.id}
          title={deck.title}
          description={deck.description ?? null}
          isArchived={deck.isArchived}
          flashcardsCount={deck.flashcards?.length ?? 0}
          updatingDeck={updatingDeck}
          onToggleArchive={handleToggleArchive}
          onEditDeck={() => setIsEditDeckOpen(true)}
          onDeleteDeck={() => setIsDeletingDeck(true)}
          onCreateCard={() => setIsCreateOpen(true)}
        />
      )}

      {/* CORREÇÃO: Tolerância Zero a "any". A prop aceita o tipo limpo inferido. */}
      {visibleFlashcards && (
        <FlashcardList
          flashcards={visibleFlashcards}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onEditCard={setEditingCard}
          onDeleteCard={setDeletingCardId}
        />
      )}

      {isCreateOpen && (
        <CreateFlashcardModal
          deckId={deck.id}
          isOpen={isCreateOpen}
          onClose={handleCloseCreateModal}
        />
      )}

      {editingCard !== null && (
        <EditFlashcardModal
          isOpen={true}
          initialFrontContent={editingCard.frontContent}
          initialBackContent={editingCard.backContent}
          initialSourceContext={editingCard.sourceContext}
          onClose={handleCloseEditCardModal}
          onSave={handleSaveEdit}
        />
      )}

      {isEditDeckOpen && (
        <EditDeckModal
          deck={deck}
          isOpen={isEditDeckOpen}
          onClose={handleCloseEditDeckModal}
        />
      )}

      {deletingCardId !== null && (
        <ConfirmModal
          isOpen={true}
          title="Excluir Flashcard"
          message="Tem certeza que deseja remover este cartão do baralho?"
          onClose={handleCloseDeleteCardModal}
          onConfirm={handleConfirmDeleteCard}
          isDanger={true}
        />
      )}

      {isDeletingDeck && (
        <ConfirmModal
          isOpen={true}
          loading={deletingDeck}
          title="Excluir Baralho Inteiro"
          message={`Esta ação apagará permanentemente o baralho "${deck.title}". O algoritmo FSRS perderá o histórico. Prosseguir?`}
          confirmText="Sim, Apagar Tudo"
          isDanger={true}
          onClose={handleCloseDeleteDeckModal}
          onConfirm={handleConfirmDeleteDeck}
        />
      )}
    </div>
  );
};