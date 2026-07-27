import { useEffect } from "react";

export interface UseStudyKeyboardOptions {
  /** Indica se o verso da carta (resposta) já está visível */
  showAnswer: boolean;
  /** Flag para desabilitar atalhos (ex: durante submissão, modal aberto ou sessão finalizada) */
  disabled?: boolean;
  /** Callback acionado ao pressionar Espaço ou Enter (quando showAnswer for false) */
  onRevealAnswer: () => void;
  /** Callback acionado ao pressionar as teclas 1, 2, 3 ou 4 (quando showAnswer for true) */
  onRating: (rating: number) => void;
}

export function useStudyKeyboard({
  showAnswer,
  disabled = false,
  onRevealAnswer,
  onRating,
}: UseStudyKeyboardOptions): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      if (!showAnswer) {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          onRevealAnswer();
        }
      } else {
        if (e.key === "1") onRating(1);
        else if (e.key === "2") onRating(2);
        else if (e.key === "3") onRating(3);
        else if (e.key === "4") onRating(4);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAnswer, disabled, onRevealAnswer, onRating]);
}