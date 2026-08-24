import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import { GET_MY_DECKS } from "../lib/graphql/deck";
import { GET_ME } from "../lib/graphql/settings";

export interface DeckSummary {
  id: string;
  title: string;
  description?: string | null;
  isArchived: boolean;
  flashcards?: Array<{ id: string }> | null;
  _count?: {
    flashcards: number;
  } | null;
}

export function useDashboard() {
  const [isCreateDeckOpen, setIsCreateDeckOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const {
    data: dataMe,
    loading: loadingMe,
    error: errorMe,
  } = useQuery(GET_ME, {
    fetchPolicy: "cache-and-network",
  });

  const {
    data: dataDecks,
    loading: loadingDecks,
    error: errorDecks,
  } = useQuery(GET_MY_DECKS, {
    fetchPolicy: "cache-and-network",
  });

  // 🟢 CORREÇÃO: Estabilização de Referência de Memória
  // Agora, se 'dataDecks?.myDecks' for undefined, o array vazio '[]'
  // será criado apenas UMA vez e sua referência na memória será mantida.
  const rawDecks = useMemo(() => {
    return (dataDecks?.myDecks as DeckSummary[]) ?? [];
  }, [dataDecks?.myDecks]);

  // Como a referência de 'rawDecks' agora é estável, estes filtros só
  // rodarão de fato quando o Apollo Client entregar dados novos.
  const activeDecks = useMemo(() => {
    return rawDecks.filter((deck) => !deck.isArchived);
  }, [rawDecks]);

  const archivedDecks = useMemo(() => {
    return rawDecks.filter((deck) => deck.isArchived);
  }, [rawDecks]);

  const totalActiveCards = useMemo(() => {
    return activeDecks.reduce((acc, deck) => {
      const count = deck.flashcards?.length ?? deck._count?.flashcards ?? 0;
      return acc + count;
    }, 0);
  }, [activeDecks]);

  // Saneamento: Duck Typing nativo, sem coerção 'as unknown'
  const user = dataMe?.me ?? null;

  // Leitura segura garantida pela extração corrigida na Query GET_ME
  const streak = user?.currentStreak ?? 0;
  const showStreakBonus = streak >= 3;
  const userName = user?.name ?? "Estudante";

  const loading = loadingMe || loadingDecks;
  const error = errorMe || errorDecks || null;

  return {
    userName,
    activeDecks,
    archivedDecks,
    totalActiveCards,
    streak,
    showStreakBonus,
    loading,
    error,
    isCreateDeckOpen,
    setIsCreateDeckOpen,
    isSettingsOpen,
    setIsSettingsOpen,
  };
}