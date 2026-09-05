import React, { useEffect, useCallback, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

import { ConfirmModal } from "../components/ConfirmModal";
import { CreateFlashcardModal } from "../components/CreateFlashcardModal";
import { EditDeckModal } from "../components/EditDeckModal";
import { EditFlashcardModal } from "../components/EditFlashcardModal";
import { DeckHeader } from "../components/DeckHeader";
import { FlashcardList } from "../components/FlashcardList";

import { useDeckDetails, type EditingCardState } from "../hooks/useDeckDetails";
import { useToast } from "../hooks/useToast";

export const DeckDetails: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Tratamento declarativo de fallback em O(1) sem coerções
  const resolvedDeckId = deckId ?? "";

  // 1. Fonte Única da Verdade em Dados (SSOT) isolada
  const {
    deck,
    loading,
    error,
    hasMore,
    visibleFlashcards,
    handleLoadMore,
    deletingDeck,
    handleSaveEdit,
    handleConfirmDeleteCard,
    handleConfirmDeleteDeck,
    handleToggleArchive,
  } = useDeckDetails(resolvedDeckId);

  // 2. Transição Limpa: UI States isolados do Motor Apollo
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditDeckOpen, setIsEditDeckOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<EditingCardState | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [isDeletingDeck, setIsDeletingDeck] = useState(false);

  useEffect(() => {
    if (error) {
      showToast(`Erro ao carregar detalhes do deck: ${error.message}`, "error");
    }
  }, [error, showToast]);

  // 3. Estabilização Referencial (Prevenção de Thrashing)
  // Utiliza-se useCallback para garantir a mesma referência de memória,
  // impedindo a remontagem destrutiva de Event Listeners nos Modais filhos.
  const openCreateModal = useCallback(() => setIsCreateOpen(true), []);
  const closeCreateModal = useCallback(() => setIsCreateOpen(false), []);

  const openEditDeckModal = useCallback(() => setIsEditDeckOpen(true), []);
  const closeEditDeckModal = useCallback(() => setIsEditDeckOpen(false), []);

  const openDeleteDeckModal = useCallback(() => setIsDeletingDeck(true), []);
  const closeDeleteDeckModal = useCallback(() => setIsDeletingDeck(false), []);

  const closeEditingCard = useCallback(() => setEditingCard(null), []);
  const closeDeletingCard = useCallback(() => setDeletingCardId(null), []);

  // 4. Handlers Intermediários para Inversão de Controle e Tear-down
  // Handlers Intermediários para Inversão de Controle e Tear-down
  const onSaveEdit = useCallback(
    (
      frontContent: string,
      backContent: string,
      sourceContext: string | null, // Tipagem idêntica à assinatura do Modal
      resetProgress: boolean, // Tipagem idêntica à assinatura do Modal
    ): void => {
      // Regra 6: Padrão Booleano Absoluto para objetos mutáveis
      if (editingCard === null) return;

      handleSaveEdit(
        editingCard.id,
        frontContent,
        backContent,
        sourceContext,
        resetProgress,
      );
      setEditingCard(null);
    },
    [editingCard, handleSaveEdit],
  );

  const onConfirmDeleteCard = useCallback(async () => {
    if (!deletingCardId) return;
    const success = await handleConfirmDeleteCard(deletingCardId);
    if (success) setDeletingCardId(null);
  }, [deletingCardId, handleConfirmDeleteCard]);

  const onConfirmDeleteDeck = useCallback(async () => {
    const success = await handleConfirmDeleteDeck();
    if (success) {
      setIsDeletingDeck(false);
      navigate("/dashboard");
    }
  }, [handleConfirmDeleteDeck, navigate]);

  // Padrão Bouncer: Degradação visual protegida via early-return
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

  // Renderização principal isolada utilizando Flexbox (sem Grid)
  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto gap-6 p-6 animate-fadeIn">
      <div className="flex items-center w-full">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 shadow-sm"
        >
          <span> Voltar ao Dashboard</span>
        </Link>
      </div>

      <DeckHeader
        deckId={deck.id}
        title={deck.title}
        description={deck.description ?? null}
        isArchived={deck.isArchived}
        flashcardsCount={deck.flashcards?.length ?? 0}
        onToggleArchive={handleToggleArchive}
        onEditDeck={openEditDeckModal}
        onDeleteDeck={openDeleteDeckModal}
        onCreateCard={openCreateModal}
      />

      <FlashcardList
        flashcards={visibleFlashcards}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        onEditCard={setEditingCard}
        onDeleteCard={setDeletingCardId}
      />

      {/* Montagem Condicional Estrita dos Modais - Tear-down assegurado */}
      {isCreateOpen && (
        <CreateFlashcardModal deckId={deck.id} onClose={closeCreateModal} />
      )}

      {editingCard !== null && (
        <EditFlashcardModal
          initialFrontContent={editingCard.frontContent}
          initialBackContent={editingCard.backContent}
          initialSourceContext={editingCard.sourceContext}
          onClose={closeEditingCard}
          onSave={onSaveEdit}
        />
      )}

      {isEditDeckOpen && (
        <EditDeckModal deck={deck} onClose={closeEditDeckModal} />
      )}

      {deletingCardId !== null && (
        <ConfirmModal
          title="Excluir Flashcard"
          message="Tem certeza que deseja remover este cartão do baralho?"
          onClose={closeDeletingCard}
          onConfirm={onConfirmDeleteCard}
          isDanger={true}
        />
      )}

      {isDeletingDeck && (
        <ConfirmModal
          loading={deletingDeck}
          title="Excluir Baralho Inteiro"
          message={`Esta ação apagará permanentemente o baralho "${deck.title}". O algoritmo FSRS perderá o histórico. Prosseguir?`}
          confirmText="Sim, Apagar Tudo"
          isDanger={true}
          onClose={closeDeleteDeckModal}
          onConfirm={onConfirmDeleteDeck}
        />
      )}
    </div>
  );
};
