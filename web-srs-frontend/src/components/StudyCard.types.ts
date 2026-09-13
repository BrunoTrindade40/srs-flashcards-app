export interface StudyCardProps {
  frontContent: string;
  // 🟢 CORRIGIDO (Regra 43): Remoção do operador opcional. Nulidade matemática absoluta exigida.
  backContent: string | null;
  sourceContext: string | null;
  isFlipped: boolean;
  onShowAnswer: () => void;
}
