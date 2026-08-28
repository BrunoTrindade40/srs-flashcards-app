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

  // Extração estabilizada (Single Source of Truth)
  const deck = data?.deck ?? null;
  const allFlashcards = deck?.flashcards ?? [];
  const totalCount = allFlashcards.length;

  const visibleFlashcards = allFlashcards.slice(0, visibleCount);
  const hasMore = visibleCount < totalCount;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + CARDS_PER_PAGE);
  }, []);

  const [removeFlashcard] = useMutation(REMOVE_FLASHCARD);
  const [updateFlashcard] = useMutation(UPDATE_FLASHCARD);
  const [deleteDeck, { loading: deletingDeck }] = useMutation(DELETE_DECK);
  const [updateDeck, { loading: updatingDeck }] = useMutation(UPDATE_DECK);

  // CORREÇÃO CRÍTICA: Extração de valores primitivos (Regra 14)
  // Isso isola os identificadores e booleanos necessários, prevenindo que o React 
  // rastreie as instâncias complexas de "deck" ou "editingCard" nos arrays de dependência.
  const isArchived = deck?.isArchived ?? false;
  const editingCardId = editingCard?.id ?? null;

  const handleToggleArchive = useCallback(async () => {
    if (!deckId) return; // Bouncer Estrito, utilizando apenas o identificador primário
    
    try {
      await updateDeck({
        variables: {
          data: {
            id: deckId,
            isArchived: !isArchived, // Utiliza a constante primitiva estabilizada
          },
        },
      });
      showToast(
        isArchived 
          ? "Baralho desarquivado com sucesso."
          : "Baralho arquivado com sucesso.",
        "success"
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro ao alterar arquivamento: ${err.message}`, "error");
      }
    }
  }, [deckId, isArchived, updateDeck, showToast]); // Array estabilizado 100% primitivo

  const handleSaveEdit = useCallback(async (
    frontContent: string,
    backContent: string,
    sourceContext?: string | null,
    resetProgress?: boolean
  ) => {
    if (!editingCardId) return; // Bouncer Estrito no primitivo extraído

    try {
      await updateFlashcard({
        variables: {
          data: {
            id: editingCardId,
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
  }, [editingCardId, updateFlashcard, showToast]); // Referência obsoleta 'editingCard' removida

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
          cache.gc(); // Garbage Collection
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