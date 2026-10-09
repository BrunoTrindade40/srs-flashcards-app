export interface EditFlashcardModalProps {
  initialFrontContent: string;
  initialBackContent: string;
  initialSourceContext: string | null; // Nulidade estrita (Regra 43) preservada
  onClose: () => void;
  onSave: (
    frontContent: string,
    backContent: string,
    sourceContext: string | null,
    resetProgress: boolean,
  ) => void;
}
