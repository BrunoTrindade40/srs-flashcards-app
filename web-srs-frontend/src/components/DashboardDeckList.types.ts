import type { DeckItem } from "../hooks/useDashboard";

export interface DashboardDeckListProps {
  activeDecks: DeckItem[];
  archivedDecks: DeckItem[];
  onCreateDeck: () => void;
}
