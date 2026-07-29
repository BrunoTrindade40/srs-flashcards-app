import { useEffect } from "react";

export interface UseStudyKeyboardOptions {
  /** Flag booleana indicando se a resposta já está visível */
  showAnswer: boolean;
  /** Callback acionado ao pressionar Espaço ou Enter para revelar a resposta */
  onShowAnswer: () => void;
  /** Callback acionado ao pressionar as teclas 1, 2, 3 ou 4 para classificar a retenção */
  onRate: (rating: number) => void;
  /** Desativa temporariamente a escuta de eventos (ex: durante carregamento) */
  disabled?: boolean;
}

/**
  * SRP: Hook responsável exclusivamente por capturar atalhos de teclado globais da sessão de estudos.
  */
export const useStudyKeyboard = ({
  showAnswer,
  onShowAnswer,
  onRate,
  disabled = false,
}: UseStudyKeyboardOptions) => {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Evita disparar atalhos se o usuário estiver digitando em um campo de texto
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (!showAnswer) {
        if (event.code === "Space" || event.key === "Enter") {
          event.preventDefault();
          onShowAnswer();
        }
      } else {
        if (event.key === "1") onRate(1);
        if (event.key === "2") onRate(2);
        if (event.key === "3") onRate(3);
        if (event.key === "4") onRate(4);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAnswer, onShowAnswer, onRate, disabled]);
};