import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DELETE_DECK,
  GET_DECK_DETAILS,
  GET_MY_DECKS,
  UPDATE_DECK,
} from "../lib/graphql/deck";
import { REMOVE_FLASHCARD, UPDATE_FLASHCARD } from "../lib/graphql/flashcard";
import { useToast } from "./useToast";

import type { GetDeckDetailsQuery } from "../gql/graphql";

// Duck Typing: Extração da assinatura tipada estrita garantida pelo Codegen.
type QueryDeck = NonNullable<GetDeckDetailsQuery["deck"]>;
type QueryFlashcard = NonNullable<QueryDeck["flashcards"]>[number];

export type EditingCardState = Pick<QueryFlashcard, 'id' | 'frontContent' | 'backContent' | 'sourceContext'>;

const CARDS_PER_PAGE = 20;

export function useDeckDetails(deckId: string | null) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const client = useApolloClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditDeckOpen, setIsEditDeckOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<EditingCardState | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [isDeletingDeck, setIsDeletingDeck] = useState(false);
  
  // Estado local para Paginação Client-Side
  const [visibleCount, setVisibleCount] = useState(CARDS_PER_PAGE);

  // A query retorna ao formato estrito suportado pelo schema atual
  const { data, loading, error } = useQuery(GET_DECK_DETAILS, {
    variables: { id: deckId ?? "" },
    skip: !deckId,
    fetchPolicy: "cache-and-network",
  });

  // Extração e Fallbacks de Segurança (Tolerância Zero a Null reference)
  const deck = data?.deck ?? null;
  const allFlashcards = deck?.flashcards ?? [];
  const totalCount = allFlashcards.length;

  // Lógica de Paginação em Memória (O(1) para fatiar o array)
  const visibleFlashcards = allFlashcards.slice(0, visibleCount);
  const hasMore = visibleCount < totalCount;

  // Carregamento instantâneo via memória, sem onerar a rede
  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + CARDS_PER_PAGE);
  }, []);

  const [removeFlashcard] = useMutation(REMOVE_FLASHCARD);
  const [updateFlashcard] = useMutation(UPDATE_FLASHCARD);
  const [deleteDeck, { loading: deletingDeck }] = useMutation(DELETE_DECK);
  const [updateDeck, { loading: updatingDeck }] = useMutation(UPDATE_DECK);

  // Manipulador isolado para a regra de negócio de Arquivamento (SRP e Tolerância Zero a "Any")
  const handleToggleArchive = async () => {
    if (!deckId || !data?.deck) return;
    try {
      await updateDeck({
        variables: {
          data: {
            id: deckId,
            isArchived: !data.deck.isArchived,
          },
        },
      });
      showToast(
        data.deck.isArchived ? "Baralho desarquivado com sucesso." : "Baralho arquivado com sucesso.",
        "success"
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro ao alterar arquivamento: ${err.message}`, "error");
      }
    }
  };

  // Assinatura atualizada para receber a flag diretamente da Interface (SSOT)
  const handleSaveEdit = async (
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
            sourceContext, // Tipagem idêntica (string | null), coalescência removida
            resetProgress
          }
        },
      });
      
      showToast("Cartão atualizado com sucesso!", "success");
      setEditingCard(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro ao atualizar cartão: ${err.message}`, "error");
      }
    }
  };

  const handleConfirmDeleteCard = async () => {
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
  };

  const handleConfirmDeleteDeck = async () => {
    if (!deckId) return;
    try {
      await deleteDeck({
        variables: { id: deckId },
        update(cache) {
          const normalizedId = cache.identify({
            id: deckId,
            __typename: "Deck",
          });
          cache.evict({ id: normalizedId });
          cache.gc();
        },
      });
      // Purga do cache de listas visuais após hard-delete
      await client.refetchQueries({ include: [GET_MY_DECKS] });
      showToast("Baralho excluído permanentemente.", "success");
      setIsDeletingDeck(false);
      navigate("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro ao excluir baralho: ${err.message}`, "error");
      }
    }
  };

  return {
    deck: data?.deck,
    loading,
    error,
    visibleFlashcards, // Exportamos estritamente a fatia a ser renderizada no DOM
    hasMore,           // Exposição do novo estado
    handleLoadMore,    // Handler síncrono de paginação
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
    handleToggleArchive, // Assinatura exposta de forma isolada
  };
}