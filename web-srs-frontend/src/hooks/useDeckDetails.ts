import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import type { Reference } from "@apollo/client/core";
import {
  DELETE_DECK,
  GET_DECK_DETAILS,
  UPDATE_DECK,
} from "../lib/graphql/deck";
import { REMOVE_FLASHCARD, UPDATE_FLASHCARD } from "../lib/graphql/flashcard";
import { useToast } from "./useToast";
import type { GetDeckDetailsQuery } from "../gql/graphql";

type QueryDeck = NonNullable<GetDeckDetailsQuery["deck"]>;
export type FlashcardItem = NonNullable<QueryDeck["flashcards"]>[number];

export interface EditingCardState {
  id: string;
  frontContent: string;
  backContent: string;
  sourceContext: string | null;
}

const CARDS_PER_PAGE = 20;

export function useDeckDetails(deckId: string | null) {
  const { showToast } = useToast();
  const [visibleCount, setVisibleCount] = useState(CARDS_PER_PAGE);

  const { data, loading, error } = useQuery(GET_DECK_DETAILS, {
    variables: { id: deckId ?? "" },
    skip: !deckId,
    fetchPolicy: "cache-and-network",
  });

  const deck = data?.deck ?? null;
  const allFlashcards = deck?.flashcards ?? [];
  const totalCount = allFlashcards.length;

  // 🟢 CORRIGIDO: Mapeamento defensivo com memoização.
  // O array é sanitizado na fronteira lógica, convertendo qualquer 'undefined'
  // gerado pelo Apollo Codegen em 'null' absoluto antes de atingir a UI.
  const visibleFlashcards = useMemo(() => {
    return allFlashcards.slice(0, visibleCount).map((card) => ({
      id: card.id,
      frontContent: card.frontContent,
      backContent: card.backContent,
      sourceContext: card.sourceContext ?? null,
    }));
  }, [allFlashcards, visibleCount]);

  const hasMore = visibleCount < totalCount;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + CARDS_PER_PAGE);
  }, []);

  const [removeFlashcard] = useMutation(REMOVE_FLASHCARD);
  const [updateFlashcard] = useMutation(UPDATE_FLASHCARD);
  const [deleteDeck, { loading: deletingDeck }] = useMutation(DELETE_DECK);
  const [updateDeck] = useMutation(UPDATE_DECK);

  // Extração Primitiva para proteção de referência (Regra 14)
  const isArchived = deck?.isArchived ?? false;
  const deckTitle = deck?.title ?? "";
  const deckDescription = deck?.description ?? null;
  const deckSourceLanguage = deck?.sourceLanguage ?? null;
  const deckTargetLanguage = deck?.targetLanguage ?? null;

  const handleToggleArchive = useCallback(async (): Promise<boolean> => {
    if (!deckId) return false;
    try {
      await updateDeck({
        variables: {
          data: { id: deckId, isArchived: !isArchived },
        },
        optimisticResponse: {
          __typename: "Mutation",
          updateDeck: {
            __typename: "Deck",
            id: deckId,
            title: deckTitle,
            description: deckDescription,
            sourceLanguage: deckSourceLanguage,
            targetLanguage: deckTargetLanguage,
            isArchived: !isArchived,
          },
        },
      });
      showToast(
        isArchived
          ? "Baralho desarquivado com sucesso."
          : "Baralho arquivado com sucesso.",
        "success",
      );
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro de conexão. Ação revertida: ${err.message}`, "error");
      }
      return false;
    }
  }, [
    deckId,
    isArchived,
    deckTitle,
    deckDescription,
    deckSourceLanguage,
    deckTargetLanguage,
    updateDeck,
    showToast,
  ]);

  const handleSaveEdit = useCallback(
    (
      cardId: string,
      frontContent: string,
      backContent: string,
      sourceContext: string | null,
      resetProgress: boolean,
    ): void => {
      // Retorno alterado para void (Fire and Forget)
      // Removida a Promise e o async
      updateFlashcard({
        variables: {
          data: {
            id: cardId,
            frontContent,
            backContent,
            sourceContext,
            resetProgress,
          },
        },
        // SUGESTÃO APLICADA: UI Otimista para Edição de Flashcards
        optimisticResponse: {
          __typename: "Mutation",
          updateFlashcard: {
            __typename: "Flashcard",
            id: cardId,
            frontContent,
            backContent,
            sourceContext: sourceContext ?? null,
            imageUrl: null, // MVP Fase 1: Injeção segura de nulidade para mídias
            audioUrl: null, // MVP Fase 1
          },
        },
      }).catch((err: unknown) => {
        // Regra 16: Tratamento de Rollback Otimista
        if (err instanceof Error) {
          showToast(
            `Erro de rede. A edição foi revertida: ${err.message}`,
            "error",
          );
        }
      });

      // Interface avança em 0ms
      showToast("Cartão atualizado com sucesso!", "success");
    },
    [updateFlashcard, showToast],
  );

  const handleConfirmDeleteCard = useCallback(
    async (cardId: string): Promise<boolean> => {
      try {
        await removeFlashcard({
          variables: { id: cardId },
          // SUGESTÃO APLICADA: Injeção de Deleção Otimista em O(1)
          optimisticResponse: {
            __typename: "Mutation",
            removeFlashcard: {
              __typename: "Flashcard",
              id: cardId, // Devolve o ID imutável para o cache reconhecer o alvo instantaneamente
            },
          },
          update(cache) {
            const normalizedId = cache.identify({
              id: cardId,
              __typename: "Flashcard",
            });
            cache.evict({ id: normalizedId });
            cache.gc(); // Garbage Collection síncrono limpa a referência fantasma na hora
          },
        });
        showToast("Flashcard removido do baralho.", "success");
        return true;
      } catch (err: unknown) {
        if (err instanceof Error) {
          showToast(
            `Erro de rede. A ação foi revertida: ${err.message}`,
            "error",
          );
        }
        return false;
      }
    },
    [removeFlashcard, showToast],
  );

  const handleConfirmDeleteDeck = useCallback(async (): Promise<boolean> => {
    if (!deckId) return false;
    try {
      await deleteDeck({
        variables: { id: deckId },
        update(cache) {
          cache.modify({
            fields: {
              myDecks(
                existingDeckRefs: readonly Reference[] = [],
                { readField },
              ) {
                return existingDeckRefs.filter(
                  (ref) => readField("id", ref) !== deckId,
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
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro ao excluir baralho: ${err.message}`, "error");
      }
      return false;
    }
  }, [deckId, deleteDeck, showToast]);

  return {
    deck,
    loading,
    error,
    visibleFlashcards,
    hasMore,
    handleLoadMore,
    deletingDeck,
    handleSaveEdit,
    handleConfirmDeleteCard,
    handleConfirmDeleteDeck,
    handleToggleArchive,
  };
}
