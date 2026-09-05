import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useSuspenseQuery } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import type { Reference } from "@apollo/client/core";

import { GET_DUE_FLASHCARDS, SUBMIT_REVIEW } from "../lib/graphql/study";
import { useToast } from "./useToast";

export const useStudyEngine = (deckId: string | null) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data } = useSuspenseQuery(GET_DUE_FLASHCARDS, {
    variables: { deckId: deckId ?? "" },
    fetchPolicy: "cache-and-network",
  });

  // ALERTA CORRIGIDO: Extração da referência para uma constante estabilizada,
  // prevenindo o uso de Optional Chaining dinâmico no array de dependências.
  const rawDueFlashcards = data?.dueFlashcards ?? null;

  // ALERTA CORRIGIDO: Captura do timestamp inicial com Lazy Initialization.
  // Impede execuções impuras (Date.now()) repetitivas na fase de renderização do React.
  const [currentMs] = useState(() => Date.now());

  // Defesa Temporal Secundária O(1) mantida de forma pura
  const queue = useMemo(() => {
    const cards = rawDueFlashcards ?? [];

    return cards.filter((card) => {
      if (!card.due) return true;
      return new Date(card.due).getTime() <= currentMs;
    });
  }, [rawDueFlashcards, currentMs]);

  const currentCard = queue[0] ?? null;
  const nextCard = queue[1] ?? null;
  const totalCards = queue.length;

  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const startTimeRef = useRef<number>(0);
  const [submitReviewMutation] = useMutation(SUBMIT_REVIEW);

  const currentCardId = currentCard?.id ?? null;
  const hasCurrentCard = currentCardId !== null;

  useEffect(() => {
    if (currentCardId !== null) {
      startTimeRef.current = performance.now();
    }
  }, [currentCardId]);

  const handleShowAnswer = useCallback(() => {
    if (!isFlipped && hasCurrentCard) {
      setIsFlipped(true);
    }
  }, [isFlipped, hasCurrentCard]);

  const handleRating = useCallback(
    async (rating: number) => {
      if (!currentCardId || !deckId) return;

      // Telemetria Monotônica despachada de forma pura, assumindo a postura
      // de "Terminal Burro". A validação de outliers pertence ao Backend.
      const rawDurationMs =
        startTimeRef.current > 0
          ? Math.round(performance.now() - startTimeRef.current)
          : 0;

      setIsFlipped(false);

      try {
        await submitReviewMutation({
          variables: {
            flashcardId: currentCardId,
            rating,
            reviewDurationMs: rawDurationMs,
          },
          optimisticResponse: {
            __typename: "Mutation",
            submitReview: true,
          },
          update(cache) {
            cache.modify({
              fields: {
                dueFlashcards(
                  existingRefs: readonly Reference[] = [],
                  { readField },
                ) {
                  const targetRef = existingRefs.find(
                    (ref) => readField("id", ref) === currentCardId,
                  );
                  const filteredRefs = existingRefs.filter(
                    (ref) => readField("id", ref) !== currentCardId,
                  );

                  if (rating === 1 && targetRef) {
                    return [...filteredRefs, targetRef];
                  }
                  return filteredRefs;
                },
              },
            });
          },
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Falha de sincronização cognitiva:", err.message);
        }
        showToast(
          "Erro de rede. O progresso falhou e o cartão retornará à fila.",
          "error",
        );
      }
    },
    [currentCardId, deckId, submitReviewMutation, showToast],
  );

  const handleExit = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  return {
    currentCard,
    nextCard,
    totalCards,
    isFlipped,
    handleShowAnswer,
    handleRating,
    handleExit,
  };
};
