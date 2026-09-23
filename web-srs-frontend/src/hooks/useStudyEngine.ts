import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useSuspenseQuery } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import type { ApolloCache, Reference } from "@apollo/client";

import { GET_DUE_FLASHCARDS, SUBMIT_REVIEW } from "../lib/graphql/study";
import { type CardState } from "../gql/graphql"; // enum gerado pelo codegen
import { useToast } from "./useToast";

// Constante de segurança contra sessão infinita (aplica-se às duas regras)
const MAX_REENQUEUES_PER_CARD = 3;

// Condição única: card ainda em learning steps.
// rating === 1 é subconjunto disso (Again nunca gradua); state 4 (leech) fica excluído.
// Aceita null: no passe otimista do update o data ainda não chegou.
// DEPOIS (PascalCase — nomes gerados pelo codegen)
const isStillLearning = (state: CardState | null): boolean =>
  state === "LEARNING" || state === "RELEARNING";

// Helper compartilhado de atualização da fila (dueFlashcards e, futuramente, getChaosStudyQueue).
// Apollo Client 4.x: readField vem das options do field modifier; ApolloCache não é genérico.
const updateSessionQueue = (
  cache: ApolloCache,
  queueField: "dueFlashcards" | "getChaosStudyQueue",
  reviewedId: string,
  shouldReenqueue: boolean,
  reenqueueCounts: Map<string, number>,
): void => {
  cache.modify({
    fields: {
      [queueField](existingRefs: readonly Reference[] = [], { readField }) {
        const reviewedRef = existingRefs.find(
          (ref) => readField("id", ref) === reviewedId,
        );
        const withoutReviewed = existingRefs.filter(
          (ref) => readField("id", ref) !== reviewedId,
        );
        if (!shouldReenqueue || !reviewedRef) return withoutReviewed;
        const count = reenqueueCounts.get(reviewedId) ?? 0;
        if (count >= MAX_REENQUEUES_PER_CARD) return withoutReviewed;
        reenqueueCounts.set(reviewedId, count + 1);
        return [...withoutReviewed, reviewedRef]; // volta ao FINAL da fila
      },
    },
  });
};

export const useStudyEngine = (deckId: string | null) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data } = useSuspenseQuery(GET_DUE_FLASHCARDS, {
    variables: { deckId: deckId ?? "" },
    fetchPolicy: "cache-and-network",
  });

  // Extração da referência para uma constante estabilizada,
  // prevenindo o uso de Optional Chaining dinâmico no array de dependências.
  const rawDueFlashcards = data?.dueFlashcards ?? null;

  // Captura do timestamp inicial com Lazy Initialization.
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
  const reenqueueCountsRef = useRef<Map<string, number>>(new Map());

  const [submitReviewMutation] = useMutation(SUBMIT_REVIEW);

  const currentCardId = currentCard?.id ?? null;
  const hasCurrentCard = currentCardId !== null;

  useEffect(() => {
    if (currentCardId !== null) {
      startTimeRef.current = performance.now();
    }
  }, [currentCardId]);

  // Reset por sessão (nova navegação / troca de deck)
  useEffect(() => {
    reenqueueCountsRef.current.clear();
  }, [deckId]);

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
            submitReview: {
              __typename: "ReviewResult",
              state: "REVIEW",
            }, // neutro
          },
          update(cache, { data }) {
            // Normaliza undefined (passe otimista) para null — convenção do projeto
            const resultingState = data?.submitReview?.state ?? null;
            const shouldReenqueue = isStillLearning(resultingState);

            updateSessionQueue(
              cache,
              "dueFlashcards",
              currentCardId,
              shouldReenqueue,
              reenqueueCountsRef.current,
            );
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
