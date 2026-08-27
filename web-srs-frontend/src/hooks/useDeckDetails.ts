import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DELETE_DECK,
  GET_DECK_DETAILS,
  UPDATE_DECK,
} from "../lib/graphql/deck";
import { REMOVE_FLASHCARD, UPDATE_FLASHCARD } from "../lib/graphql/flashcard";
import { useToast } from "./useToast";
import type { Reference } from "@apollo/client/core";
import type { GetDeckDetailsQuery } from "../gql/graphql";

type QueryDeck = NonNullable<GetDeckDetailsQuery["deck"]>;
export type FlashcardItem = NonNullable<QueryDeck["flashcards"]>[number];

// Trazemos a interface para o controlador do estado
export interface EditingCardState {
  id: string;
  frontContent: string;
  backContent: string;
  sourceContext?: string | null;
}

const CARDS_PER_PAGE = 20;

export function useDeckDetails(deckId: string | null) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditDeckOpen, setIsEditDeckOpen] = useState(false);
  // 5. O estado reconhece naturalmente a interface tipada
  const [editingCard, setEditingCard] = useState<EditingCardState | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [isDeletingDeck, setIsDeletingDeck] = useState(false);

  // Estado local para Paginação Client-Side (Performance O(1))
  const [visibleCount, setVisibleCount] = useState(CARDS_PER_PAGE);

  const { data, loading, error } = useQuery(GET_DECK_DETAILS, {
    variables: { id: deckId ?? "" },
    skip: !deckId,
    fetchPolicy: "cache-and-network",
  });

  // Extração e Fallbacks de Segurança (Tolerância Zero a Null reference)
  // Extração estabilizada e higienizada (Single Source of Truth)
  const deck = data?.deck ?? null;
  const allFlashcards = deck?.flashcards ?? [];
  const totalCount = allFlashcards.length;

  // Lógica de Paginação em Memória
  const visibleFlashcards = allFlashcards.slice(0, visibleCount);
  const hasMore = visibleCount < totalCount;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + CARDS_PER_PAGE);
  }, []);

  const [removeFlashcard] = useMutation(REMOVE_FLASHCARD);
  const [updateFlashcard] = useMutation(UPDATE_FLASHCARD);
  const [deleteDeck, { loading: deletingDeck }] = useMutation(DELETE_DECK);
  const [updateDeck, { loading: updatingDeck }] = useMutation(UPDATE_DECK);

  // Manipulador isolado para a regra de negócio de Arquivamento (SRP)
  // SUGESTÃO APLICADA: Estabilização de referência para as mutações assíncronas do Custom Hook
  // CORREÇÃO: Utilização estrita da variável 'deck' em vez de computar 'data?.deck'
  // Isso atende 100% aos requisitos de análise estática do React Compiler.
  const handleToggleArchive = useCallback(async () => {
    if (!deckId || !deck) return; // Substituído !data?.deck por !deck
    
    try {
      await updateDeck({
        variables: {
          data: {
            id: deckId,
            isArchived: !deck.isArchived, // Substituído data.deck por deck
          },
        },
      });
      showToast(
        deck.isArchived // Substituído data.deck por deck
          ? "Baralho desarquivado com sucesso."
          : "Baralho arquivado com sucesso.",
        "success"
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro ao alterar arquivamento: ${err.message}`, "error");
      }
    }
  }, [deckId, deck, updateDeck, showToast]);

  const handleSaveEdit = useCallback(async (
    frontContent: string,
    backContent: string,
    sourceContext?: string | null,
    resetProgress?: boolean
  ) => {
    if (!editingCard) return;
    try {
      await updateFlashcard({
        variables: {
          data: {
            id: editingCard.id,
            frontContent,
            backContent,
            sourceContext,
            resetProgress,
          },
        },
      });
      showToast("Cartão atualizado com sucesso!", "success");
      setEditingCard(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro ao atualizar cartão: ${err.message}`, "error");
      }
    }
  }, [editingCard, updateFlashcard, showToast]);

  const handleConfirmDeleteCard = useCallback(async () => {
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
          cache.gc();
        },
      });
      showToast("Flashcard removido do baralho.", "success");
      setDeletingCardId(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro ao deletar cartão: ${err.message}`, "error");
      }
    }
  }, [deletingCardId, removeFlashcard, showToast]);

  const handleConfirmDeleteDeck = useCallback(async () => {
    if (!deckId) return;
    try {
      await deleteDeck({
        variables: { id: deckId },
        update(cache) {
          cache.modify({
            fields: {
              myDecks(existingDeckRefs: readonly Reference[] = [], { readField }) {
                return existingDeckRefs.filter(
                  (ref) => readField("id", ref) !== deckId
                );
              },
            },
          });
          const normalizedDeckId = cache.identify({
            id: deckId,
            __typename: "Deck",
          });
          cache.evict({ id: normalizedDeckId });
          cache.gc();
        },
      });
      showToast("Baralho excluído permanentemente.", "success");
      setIsDeletingDeck(false);
      navigate("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro ao excluir baralho: ${err.message}`, "error");
      }
    }
  }, [deckId, deleteDeck, showToast, navigate]);

  return {
    deck: data?.deck,
    loading,
    error,
    visibleFlashcards,
    hasMore,
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
  };
}