import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import { GET_DUE_FLASHCARDS, SUBMIT_REVIEW } from '../lib/graphql/study';
import { useToast } from './useToast';

export const useStudyEngine = (deckId: string | null) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // 1. Telemetria Pura (React 19): Lazy initialization.
  // Garante que o timestamp seja capturado apenas uma vez na montagem do hook,
  // mantendo o corpo da função estritamente puro.
  const [sessionTime] = useState(() => Date.now());

  const { data, loading, error } = useQuery(GET_DUE_FLASHCARDS, {
    variables: { deckId: deckId! },
    skip: !deckId,
    fetchPolicy: 'cache-and-network',
  });

  // 2. Programação Defensiva: Filtra os cartões baseando-se no timestamp exato (FSRS).
  // Isso mitiga o bug de truncamento de data do backend (DATE <= CURRENT_DATE).
  const queue = useMemo(() => {
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
      if (!currentCard || submitting || !deckId) return;
      
      setSubmitting(true);

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
            const existing = cache.readQuery({
              query: GET_DUE_FLASHCARDS,
              variables: { deckId }, 
            });

            if (existing && existing.dueFlashcards) {
              const newQueue = [...existing.dueFlashcards];
              
              // 3. Segurança Estrutural: Busca por ID em vez de supor a ordem (evita Race Conditions)
              const targetIndex = newQueue.findIndex(c => c.id === targetCard.id);
              if (targetIndex > -1) {
                newQueue.splice(targetIndex, 1);
              }

              // Se Errou (1), FSRS joga de volta ao final da fila para repetição imediata
              if (rating === 1) {
                newQueue.push(targetCard);
              }

              cache.writeQuery({
                query: GET_DUE_FLASHCARDS,
                variables: { deckId }, 
                data: { dueFlashcards: newQueue },
              });
            }
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