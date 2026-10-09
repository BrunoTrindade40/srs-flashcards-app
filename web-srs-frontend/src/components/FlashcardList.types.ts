import type { EditingCardState } from "../hooks/useDeckDetails";

export interface FlashcardItemProps {
  id: string;
  frontContent: string;
  backContent: string;
  // 🔴 REMOVIDO: sourceContext?: string | null;
  // 🟢 CORRIGIDO: Remoção do operador opcional. Exige-se a declaração explícita de nulidade.
  sourceContext: string | null;
  onEdit: (card: EditingCardState) => void;
  onDelete: (id: string) => void;
}

export interface FlashcardListProps {
  flashcards: Array<{
    id: string;
    frontContent: string;
    backContent: string;
    // 🟢 CORRIGIDO: Nulidade rigorosa imposta aos itens do Array lidos do Cache do Apollo
    sourceContext: string | null;
  }>;
  hasMore: boolean;
  onLoadMore: () => void;
  onEditCard: (card: EditingCardState) => void;
  onDeleteCard: (id: string) => void;
}
