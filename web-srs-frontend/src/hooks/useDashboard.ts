import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import { GET_MY_DECKS } from "../lib/graphql/deck";
import { GET_ME } from "../lib/graphql/settings";
import type { GetMyDecksQuery } from "../gql/graphql";

// 🔵 SUGESTÃO: Derivação de tipo atômico diretamente do Codegen (Elimina a interface manual DeckSummary)
export type DeckItem = NonNullable<GetMyDecksQuery["myDecks"]>[number];

export function useDashboard() {
  const [isCreateDeckOpen, setIsCreateDeckOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 1. Inferência estrita e nativa via TypedDocumentNode (Sem Generics manuais ou asserções)
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

  // 2. 🔴 CRÍTICO CORRIGIDO: Remoção do 'as DeckSummary[]'. Confiamos 100% na inferência do Codegen.
  const rawDecks = useMemo(() => {
    return dataDecks?.myDecks ?? [];
  }, [dataDecks?.myDecks]);

  // 3. Filtros puros operando sobre a tipagem exata da query GraphQL
  const activeDecks = useMemo(() => {
    return rawDecks.filter((deck) => !deck.isArchived);
  }, [rawDecks]);

  const archivedDecks = useMemo(() => {
    return rawDecks.filter((deck) => deck.isArchived);
  }, [rawDecks]);

  // 4. Redução precisa baseada exclusivamente no contrato de campos de GET_MY_DECKS (_count)
  const totalActiveCards = useMemo(() => {
    return activeDecks.reduce((acc, deck) => {
      const count = deck._count?.flashcards ?? 0;
      return acc + count;
    }, 0);
  }, [activeDecks]);

  // 5. Duck Typing e segurança de nulidade sem asserções
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