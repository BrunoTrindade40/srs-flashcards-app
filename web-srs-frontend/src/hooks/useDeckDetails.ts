// hooks/useDeckDetails.ts
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DELETE_DECK,
  GET_DECK_DETAILS,
  GET_MY_DECKS,
  UPDATE_DECK,
} from "../lib/graphql/deck";
import { REMOVE_FLASHCARD, UPDATE_FLASHCARD } from "../lib/graphql/flashcard";
import { useToast } from "./useToast";

import type {
  GetDeckDetailsQuery,
  GetDeckDetailsQueryVariables,
  UpdateFlashcardMutation,
  UpdateFlashcardMutationVariables,
} from "../gql/graphql";

export interface EditingCardState {
  id: string;
  frontContent: string;
  backContent: string;
}

export function useDeckDetails(deckId: string | null) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const client = useApolloClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditDeckOpen, setIsEditDeckOpen] = useState(false);
  
  const [editingCard, setEditingCard] = useState<EditingCardState | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [isDeletingDeck, setIsDeletingDeck] = useState(false);

  const { data, loading, error } = useQuery<
    GetDeckDetailsQuery,
    GetDeckDetailsQueryVariables
  >(GET_DECK_DETAILS, {
    variables: { id: deckId || "" },
    skip: !deckId,
    fetchPolicy: "network-only",
  });

  const [removeFlashcard] = useMutation(REMOVE_FLASHCARD);
  const [updateFlashcard] = useMutation<
    UpdateFlashcardMutation,
    UpdateFlashcardMutationVariables
  >(UPDATE_FLASHCARD);
  
  const [deleteDeck, { loading: deletingDeck }] = useMutation(DELETE_DECK);
  const [updateDeck, { loading: updatingArchive }] = useMutation(UPDATE_DECK);

  // CORREÇÃO: Lógica integral restaurada consumindo client, navigate, etc.
  const handleToggleArchive = async () => {
    if (!data?.deck) return;
    try {
      const newStatus = !data.deck.isArchived;
      await updateDeck({
        variables: {
          data: {
            id: data.deck.id,
            isArchived: newStatus,
          },
        },
      });
      showToast(
        newStatus
          ? "Baralho enviado para o arquivo."
          : "Baralho reativado com sucesso.",
        "success"
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro ao alterar status: ${err.message}`, "error");
      }
    }
  };

  const handleSaveEdit = async (frontContent: string, backContent: string) => {
    if (!editingCard) return;
    try {
      await updateFlashcard({
        variables: {
          data: { 
            id: editingCard.id, 
            frontContent, 
            backContent 
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
          // Mantemos a manipulação do Apollo Cache através do ID em memória
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
    updatingArchive,
    deletingDeck,
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
    handleToggleArchive,
    handleSaveEdit,
    handleConfirmDeleteCard,
    handleConfirmDeleteDeck,
  };
}