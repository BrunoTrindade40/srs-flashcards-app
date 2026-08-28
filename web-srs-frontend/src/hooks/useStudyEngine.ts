import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router-dom';
import type { Reference } from '@apollo/client/core';
import { GET_DUE_FLASHCARDS, SUBMIT_REVIEW } from '../lib/graphql/study';
import { useToast } from './useToast';

export const useStudyEngine = (deckId: string | null) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data, loading, error } = useQuery(GET_DUE_FLASHCARDS, {
    variables: { deckId: deckId ?? "" },
    skip: !deckId,
    fetchPolicy: 'cache-and-network',
  });

  // 1. Extração Estabilizada (React Compiler Proof)
  // Evita o vazamento de Optional Chaining nos arrays de dependência de Hooks
  const rawDueFlashcards = data?.dueFlashcards ?? null;

  // 2. Barreira Defensiva Temporal (Filtro Secundário local O(N))
  // Aplica o Rollover de sessão (RN06) protegendo o usuário de vazamentos via UTC
  const queue = useMemo(() => {
    const cards = rawDueFlashcards ?? [];
    if (cards.length === 0) return [];

    const now = new Date();
    const currentHour = now.getHours();

    // Ancoragem do momento exato do Rollover de HOJE (04:00:00.000 AM local)
    const todayRolloverMs = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      4, 0, 0, 0
    ).getTime();

    // Determina a janela máxima (Cutoff):
    // - Antes das 04:00 AM: o dia "lógico" ainda é ontem. O limite vai até 04:00 AM de HOJE.
    // - Depois das 04:00 AM: iniciou-se um novo dia "lógico". O limite vai até 04:00 AM de AMANHÃ.
    const sessionCutoffMs = currentHour < 4
      ? todayRolloverMs
      : todayRolloverMs + 86400000; // + 24 horas em milissegundos

    return cards.filter((card) => {
      // Cartões "Novos" (sem data definida no algoritmo FSRS) sempre entram na fila
      if (!card.due) return true;

      const dueTimeMs = new Date(card.due).getTime();
      // Bloqueio Matemático: O cartão só é exibido se seu vencimento couber na sessão lógica atual
      return dueTimeMs <= sessionCutoffMs;
    });
  }, [rawDueFlashcards]);

  // 3. SSOT: Consumo em tempo constante O(1) ancorado no topo da fila filtrada
  const currentCard = queue[0] ?? null;
  const nextCard = queue[1] ?? null;
  const totalCards = queue.length;

  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const startTimeRef = useRef<number>(0);

  const [submitReviewMutation] = useMutation(SUBMIT_REVIEW);

  // 4. Extração Atômica Estabilizada
  // Isolamos o identificador primitivo da carta, forçando nulidade clara, 
  // eliminando renderizações causadas por simples trocas de referência do objeto.
  const currentCardId = currentCard?.id ?? null;

  // 5. Efeito Puro para Telemetria
  useEffect(() => {
    if (currentCardId !== null) {
      startTimeRef.current = performance.now();
    }
  }, [currentCardId]);

  const handleShowAnswer = useCallback(() => {
    if (!isFlipped && currentCard) {
      setIsFlipped(true);
    }
  }, [isFlipped, currentCard]);

  const handleRating = useCallback(
    async (rating: number) => {
      // Padrão Bouncer: Salvaguarda contra cliques fantasmas (Early Fail)
      if (!currentCard || !deckId) return;

      const rawDurationMs =
        startTimeRef.current > 0
          ? Math.round(performance.now() - startTimeRef.current)
          : 0;

      // Defesa na Fronteira: Grampo de contenção matemática cravado em 60 segundos máximos
      const safeDurationMs = Math.max(0, Math.min(rawDurationMs, 60000));
      const targetCard = currentCard;

      // RESOLUÇÃO CRÍTICA: O reposicionamento visual (flip) ocorre síncronamente 
      // abortando renderizações duplas através de efeitos em cascata.
      setIsFlipped(false);

      try {
        await submitReviewMutation({
          variables: {
            flashcardId: targetCard.id,
            rating,
            reviewDurationMs: safeDurationMs,
          },
          optimisticResponse: {
            __typename: "Mutation",
            submitReview: true,
          },
          update(cache) {
            cache.modify({
              fields: {
                dueFlashcards(existingRefs: readonly Reference[] = [], { readField }) {
                  return existingRefs.filter(
                    (ref) => readField("id", ref) !== targetCard.id
                  );
                },
              },
            });
          },
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('Falha de sincronização na avaliação cognitiva:', err.message);
        }
        showToast('Erro de rede. O progresso falhou e o cartão retornará à fila.', 'error');
      }
    },
    [currentCard, submitReviewMutation, deckId, showToast]
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
    handleShowAnswer,
    handleRating,
    handleExit,
  };
};