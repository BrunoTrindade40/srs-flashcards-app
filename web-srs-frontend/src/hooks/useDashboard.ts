import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import { GET_MY_DECKS } from "../lib/graphql/deck";
import { GET_ME } from "../lib/graphql/settings";
import type { GetMyDecksQuery } from "../gql/graphql";

// Extração atômica gerada pelo Codegen (Single Source of Truth)
export type DeckItem = NonNullable<GetMyDecksQuery["myDecks"]>[number];

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

  const rawDecks = useMemo(() => {
    return dataDecks?.myDecks ?? [];
  }, [dataDecks?.myDecks]);

  const activeDecks = useMemo(() => {
    return rawDecks.filter((deck) => !deck.isArchived);
  }, [rawDecks]);

  const archivedDecks = useMemo(() => {
    return rawDecks.filter((deck) => deck.isArchived);
  }, [rawDecks]);

  // CORREÇÃO: Contagem de coleção normalizada na memória RAM.
  // Reage automaticamente às mutações locais criadas por refetchQueries ou evict.
  const totalActiveCards = useMemo(() => {
    return activeDecks.reduce((acc, deck) => {
      const count = deck.flashcards?.length ?? 0;
      return acc + count;
    }, 0);
  }, [activeDecks]);

  const user = dataMe?.me ?? null;
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