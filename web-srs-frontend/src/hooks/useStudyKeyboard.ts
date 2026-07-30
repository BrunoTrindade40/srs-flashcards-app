import { useEffect } from "react";

interface UseStudyKeyboardProps {
  showAnswer: boolean;
  onShowAnswer: () => void;
  onRate: (rating: number) => void;
  // 🟢 REGRA APLICADA: Novo contrato para o atalho de saída global
  onExit?: () => void;
  disabled?: boolean;
}

export function useStudyKeyboard({
  showAnswer,
  onShowAnswer,
  onRate,
  onExit,
  disabled = false,
}: UseStudyKeyboardProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora atalhos se o sistema estiver processando/carregando
      if (disabled) return;

      // 🟢 OTIMIZAÇÃO: Escape para sair da sessão instantaneamente
      if (e.key === "Escape") {
        e.preventDefault();
        if (onExit) onExit();
        return;
      }

      // Previne o "scroll" padrão da página ao apertar Espaço
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (!showAnswer) {
          onShowAnswer();
        }
        return;
      }

      // Avaliação Estocástica (1, 2, 3, 4) só funciona se o verso estiver visível
      if (showAnswer) {
        switch (e.key) {
          case "1":
            onRate(1);
            break;
          case "2":
            onRate(2);
            break;
          case "3":
            onRate(3);
            break;
          case "4":
            onRate(4);
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAnswer, onShowAnswer, onRate, onExit, disabled]);
}