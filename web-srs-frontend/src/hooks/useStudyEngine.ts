import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { GET_DUE_FLASHCARDS, SUBMIT_REVIEW } from '../lib/graphql/study';
import { useToast } from './useToast';
import type { Reference } from '@apollo/client/core';

const generateStableHash = (id: string, seed: number) => {
  let hash = 0;
  const str = id + seed.toString();
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};

export const useStudyEngine = (deckId: string | null) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const ROLLOVER_OFFSET_MS = 14400000;
  const [sessionTime] = useState(() => Date.now() - ROLLOVER_OFFSET_MS);

  const { data, loading, error } = useQuery(GET_DUE_FLASHCARDS, {
    variables: { deckId: deckId ?? "" },
    skip: !deckId,
    fetchPolicy: 'cache-and-network',
  });

  const queue = useMemo(() => {
    // EXTRAÇÃO SEGURA: A expressão e o fallback ocorrem no interior do hook.
    // O array vazio [] gerado aqui não vazará como dependência externa.
    const dueFlashcardsList = data?.dueFlashcards ?? [];

    const filteredQueue = dueFlashcardsList.filter(card => {
      if (!card.due) return true;
      return new Date(card.due).getTime() <= sessionTime;
    });

    return filteredQueue.sort((a, b) => {
      return generateStableHash(a.id, sessionTime) - generateStableHash(b.id, sessionTime);
    });
  }, [data, sessionTime]); // O array escuta o objeto 'data' (estabilizado na memória pelo Apollo)

  const currentCard = queue[0] ?? null;
  const nextCard = queue[1] ?? null;
  const totalCards = queue.length;

  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const startTimeRef = useRef<number>(0);
  const [submitReviewMutation] = useMutation(SUBMIT_REVIEW);

  useEffect(() => {
    if (currentCard) {
      startTimeRef.current = performance.now();
    }
  }, [currentCard]);

  const handleShowAnswer = useCallback(() => {
    if (!isFlipped && currentCard) {
      setIsFlipped(true);
    }
  }, [isFlipped, currentCard]);

  const handleRating = useCallback(
    async (rating: number) => {
      if (!currentCard || submitting || !deckId) return;
      
      setSubmitting(true);

      const rawDurationMs = startTimeRef.current > 0
          ? Math.round(performance.now() - startTimeRef.current)
          : 0;
      
      const safeDurationMs = Math.max(0, Math.min(rawDurationMs, 60000));
      const targetCard = currentCard;
      setIsFlipped(false);

      try {
        await submitReviewMutation({
          variables: {
            flashcardId: targetCard.id,
            rating,
            reviewDurationMs: safeDurationMs,
          },
          update(cache) {
            cache.modify({
              fields: {
                dueFlashcards(existingRefs: readonly Reference[] = [], { readField, toReference }) {
                  const filteredQueue = existingRefs.filter(
                    (ref) => readField("id", ref) !== targetCard.id
                  );
                  if (rating === 1) {
                    const cardRef = toReference(targetCard);
                    return cardRef ? [...filteredQueue, cardRef] : filteredQueue;
                  }
                  return filteredQueue;
                },
              },
            });
          },
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('Falha de sincronização na avaliação cognitiva:', err.message);
        }
        showToast('Erro ao salvar progresso. Verifique sua conexão.', 'error');
      } finally {
        setSubmitting(false);
      }
    },
    [currentCard, submitting, submitReviewMutation, deckId, showToast]
  );

  const handleExit = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  return {
    currentCard,
    nextCard,
    totalCards,
    isFlipped,
    loading,
    error,
    submitting,
    handleShowAnswer,
    handleRating,
    handleExit,
  };
};