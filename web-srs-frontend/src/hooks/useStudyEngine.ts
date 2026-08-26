import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react'; // Importação estrita da UI do Apollo
import { useNavigate } from 'react-router-dom';
import { GET_DUE_FLASHCARDS, SUBMIT_REVIEW } from '../lib/graphql/study';
import { useToast } from './useToast';
import type { Reference } from '@apollo/client/core';

export const useStudyEngine = (deckId: string | null) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // 1. Telemetria Pura (React 19): Lazy initialization.
  // Garante que o timestamp seja capturado apenas uma vez na montagem do hook,
  // mantendo o corpo da função estritamente puro.
  const [sessionTime] = useState(() => Date.now());

  const { data, loading, error } = useQuery(GET_DUE_FLASHCARDS, {
    // 🟡 ALERTA CORRIGIDO: Fallback seguro substituindo o operador "!".
    // A string vazia satisfaz o contrato do TypeScript, enquanto o 'skip' protege a rede[cite: 21].
    variables: { deckId: deckId ?? "" },
    skip: !deckId,
    fetchPolicy: 'cache-and-network',
  });

  // 2. Programação Defensiva: Filtra os cartões baseando-se no timestamp exato (FSRS).
  // Isso mitiga o bug de truncamento de data do backend (DATE <= CURRENT_DATE).
  const queue = useMemo(() => {
    // Coalescência Nula segura como fallback base[cite: 21].
    const rawQueue = data?.dueFlashcards ?? [];
    
    return rawQueue.filter(card => {
      // Cartões novos (estado virgem) podem não possuir 'due' ainda.
      if (!card.due) return true; 
      // Compara em milissegundos. Se o cartão for para daqui a 5 min, é barrado.
      return new Date(card.due).getTime() <= sessionTime;
    });
  }, [data?.dueFlashcards, sessionTime]);

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
      // Padrão Bouncer e Type Guardeing O(1): Valida dependências e garante 
      // que 'deckId' é estritamente uma string neste escopo isolado[cite: 21].
      if (!currentCard || submitting || !deckId) return;
      
      setSubmitting(true);

      // Telemetria monotônica segura[cite: 21].
      const durationMs = startTimeRef.current > 0 
        ? Math.round(performance.now() - startTimeRef.current) 
        : 0;
        
      const targetCard = currentCard;
      setIsFlipped(false);

      try {
        await submitReviewMutation({
          variables: {
            flashcardId: targetCard.id,
            rating,
            reviewDurationMs: durationMs,
          },
          update(cache) {
            // CORREÇÃO: Utilização rigorosa da API de manipulação imutável do Apollo v4
            cache.modify({
              fields: {
                dueFlashcards(existingRefs: readonly Reference[] = [], { readField, toReference }) {
                  // 1. Método Puro: Filtra a fila removendo o cartão recém-respondido através da conferência estrita de ID
                  const filteredQueue = existingRefs.filter(
                    (ref) => readField("id", ref) !== targetCard.id
                  );

                  // 2. Comportamento FSRS: Se o usuário errou (rating 1), recoloca no final da fila de repetição
                  if (rating === 1) {
                    const cardRef = toReference(targetCard);
                    // Aplicação estrita de Spread Operator garantindo 100% de imutabilidade
                    return cardRef ? [...filteredQueue, cardRef] : filteredQueue;
                  }

                  return filteredQueue;
                },
              },
            });
          },
        });
      } catch (err: unknown) {
        // Narrowing rígido para evitar o vazamento de 'any' na exceção[cite: 21].
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