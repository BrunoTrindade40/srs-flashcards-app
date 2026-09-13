export interface DeckHeaderProps {
  deckId: string;
  title: string;
  description: string | null;
  isArchived: boolean;
  flashcardsCount: number;
  onToggleArchive: () => void;
  onEditDeck: () => void;
  onDeleteDeck: () => void;
  onCreateCard: () => void;
}
