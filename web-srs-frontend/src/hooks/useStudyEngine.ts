import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GET_MY_DECKS } from "../lib/graphql/deck";
import { GET_ME } from "../lib/graphql/settings";
import {
  GET_DUE_FLASHCARDS,
  SUBMIT_REVIEW,
  type FlashcardInStudy,
} from "../lib/graphql/study";
import { useDailyReviewTracker } from "./useDailyReviewTracker";
import { useToast } from "./useToast";

// 🟢 REGRA APLICADA: Assinatura estrita rejeitando 'undefined'.
export function useStudyEngine(deckId: string | null) {
  const navigate = useNavigate();
  const client = useApolloClient();
  const { showToast } = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const { data: dataMe } = useQuery(GET_ME, { fetchPolicy: "cache-first" });
  const userStats = dataMe?.me;

  const { todayReviewCount, incrementReviewCount } = useDailyReviewTracker(
    userStats?.id ?? null,
  );

  const maxDailyReviews = userStats?.maxDailyReviews;
  const hasReachedDailyLimit = maxDailyReviews
    ? todayReviewCount >= maxDailyReviews
    : false;

  const { data, loading, error, refetch } = useQuery(GET_DUE_FLASHCARDS, {
    // Tratamento de fallback seguro para a string vazia caso seja null, evitando quebra no Apollo
    variables: { deckId: deckId || "" },
    skip: !deckId,
    fetchPolicy: "network-only",
  });

  const [submitReview, { loading: submitting }] = useMutation(SUBMIT_REVIEW);

  const sessionQueue = useMemo(() => {
    return (data?.dueFlashcards as FlashcardInStudy[]) || [];
  }, [data?.dueFlashcards]);

  const currentCard = sessionQueue[currentIndex];
  const nextCard =
    currentIndex + 1 < sessionQueue.length
      ? sessionQueue[currentIndex + 1]
      : null;

  const handleExit = useCallback(() => navigate("/dashboard"), [navigate]);

  // 🟢 REGRA APLICADA: Referência de alta precisão para telemetria
  const flipTimeRef = useRef<number>(0);

  const handleShowAnswer = useCallback(() => {
    setIsFlipped(true);
    // 🔵 SUGESTÃO: Inicia o cronômetro com o relógio monotônico do navegador
    flipTimeRef.current = performance.now();
  }, []);

  const handleRating = async (rating: number) => {
    if (!currentCard || submitting || !isFlipped) return;

    // 🟢 REGRA APLICADA: Math.round() é OBRIGATÓRIO aqui.
    // performance.now() devolve um Float. O GraphQL (via Apollo) rejeitará a mutation
    // se tentarmos enviar um Float para uma variável tipada como Int!.
    const reviewDurationMs = Math.round(performance.now() - flipTimeRef.current);
    const isNewCard = currentCard.fsrsData?.state === "NEW" || currentCard.fsrsData?.state === "0";

    try {
      await submitReview({
        variables: {
          flashcardId: currentCard.id,
          rating,
          reviewDurationMs // Envio do inteiro exato
        },
      });

      incrementReviewCount(isNewCard);
      setIsFlipped(false);

      // Reseta o cronômetro para evitar vazamento de estado
      flipTimeRef.current = 0;

      const isLastCard = currentIndex + 1 >= sessionQueue.length;

      if (!isLastCard) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Lógica de resgate de cartões em reaprendizado via Backend (Single Source of Truth)
        const { data: newData } = await refetch();
        const remainingCards = newData?.dueFlashcards || [];

        if (remainingCards.length > 0) {
          setCurrentIndex(0);
          showToast(
            "Ainda temos cartões em reaprendizado. Vamos fixá-los!",
            "info",
          );
        } else {
          await Promise.all([
            client.query({ query: GET_ME, fetchPolicy: "network-only" }),
            client.query({ query: GET_MY_DECKS, fetchPolicy: "network-only" }),
          ]);
          showToast(
            "Brilhante! O loop de consolidação foi concluído com sucesso.",
            "success",
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
    currentIndex,
    totalCards: sessionQueue.length,
    isFlipped,
    loading,
    error,
    submitting,
    hasReachedDailyLimit,
    maxDailyReviews: userStats?.maxDailyReviews,
    handleShowAnswer,
    handleRating,
    handleExit,
  };
}