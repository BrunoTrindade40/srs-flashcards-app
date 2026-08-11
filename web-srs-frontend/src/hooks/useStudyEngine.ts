import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
// 🔴 CORREÇÃO CRÍTICA: Manutenção da importação nativa de Reference
import type { Reference } from "@apollo/client/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GET_DECK_DETAILS, GET_MY_DECKS } from "../lib/graphql/deck";
import { GET_ME } from "../lib/graphql/settings";
import { GET_DUE_FLASHCARDS, SUBMIT_REVIEW } from "../lib/graphql/study";
import { useToast } from "./useToast";

export function useStudyEngine(deckId: string | null) {
  const navigate = useNavigate();
  const client = useApolloClient();
  const { showToast } = useToast();

  const [isFlipped, setIsFlipped] = useState(false);

  // ⏱️ Telemetria Monotônica
  const cardStartTimeRef = useRef<number>(0);

  // 🧠 O Padrão Terminal Burro
  const { data, loading, error, refetch } = useQuery(GET_DUE_FLASHCARDS, {
    variables: { deckId: deckId ?? "" },
    skip: !deckId,
    fetchPolicy: "network-only",
  });

  // 🔄 Fechamento de Loop Stateless
  const [submitReview, { loading: submitting }] = useMutation(SUBMIT_REVIEW, {
    update(cache, { data: mutationData }, { variables }) {
      if (mutationData?.submitReview && variables?.flashcardId) {
        cache.modify({
          fields: {
            // 🔴 CORREÇÃO CRÍTICA: Aplicação do modificador 'readonly'
            // Isso satisfaz o contrato do Apollo Client v4 de que o cache original nunca será mutado diretamente.
            dueFlashcards(existingCards: readonly Reference[] = [], { readField }) {
              return existingCards.filter(
                (cardRef) => readField("id", cardRef) !== variables?.flashcardId
              );
            },
          },
        });
      }
    },
  });

  const sessionQueue = data?.dueFlashcards ?? [];

  // 🔵 Orquestração Stateless
  const currentCard = sessionQueue[0] ?? null;
  const nextCard = sessionQueue[1] ?? null;

  useEffect(() => {
    if (currentCard?.id && !isFlipped) {
      cardStartTimeRef.current = performance.now();
    }
  }, [currentCard?.id, isFlipped]);

  const handleExit = useCallback(() => navigate("/dashboard"), [navigate]);

  const handleShowAnswer = useCallback(() => {
    setIsFlipped(true);
  }, []);

  const handleRating = async (rating: number) => {
    if (!currentCard || submitting || !isFlipped) return;

    const reviewDurationMs = Math.max(
      0,
      Math.round(performance.now() - cardStartTimeRef.current)
    );

    try {
      await submitReview({
        variables: {
          flashcardId: currentCard.id,
          rating,
          reviewDurationMs,
        },
      });

      setIsFlipped(false);
      cardStartTimeRef.current = 0;

      if (sessionQueue.length <= 1) {
        const { data: newData } = await refetch();
        const remainingCards = newData?.dueFlashcards ?? [];

        if (remainingCards.length > 0) {
          showToast("Sincronizando próxima rodada de cartões...", "info");
        } else {
          await Promise.all([
            client.query({ query: GET_ME, fetchPolicy: "network-only" }),
            client.query({
              query: GET_DECK_DETAILS,
              variables: { id: deckId ?? "" },
              fetchPolicy: "network-only",
            }),
            client.query({ query: GET_MY_DECKS, fetchPolicy: "network-only" }),
          ]);
          showToast(
            "Brilhante! O loop de consolidação foi concluído.",
            "success"
          );
          navigate("/dashboard");
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro ao registrar revisão: ${err.message}`, "error");
      }
    }
  };

  return {
    currentCard,
    nextCard,
    totalCards: sessionQueue.length,
    isFlipped,
    loading,
    error,
    submitting,
    handleShowAnswer,
    handleRating,
    handleExit,
  };
}