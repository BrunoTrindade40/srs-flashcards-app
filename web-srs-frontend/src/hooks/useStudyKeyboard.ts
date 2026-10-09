import { useEffect, useRef } from "react";

interface UseStudyKeyboardProps {
  showAnswer: boolean;
  onShowAnswer: () => void;
  onRate: (rating: number) => void;
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
  // 1. Telemetria de Estado via useRef (O Padrão Latest Ref)
  // Armazenamos todas as props recebidas em uma referência mutável.
  const stateRef = useRef({ showAnswer, onShowAnswer, onRate, onExit, disabled });

  // 2. Sincronização Estrita O(1)
  // Atualizamos a ref a cada render. Como alterar uma ref não gera re-render,
  // isso garante que o Event Listener tenha sempre o valor correto no milissegundo exato.
  useEffect(() => {
    stateRef.current = { showAnswer, onShowAnswer, onRate, onExit, disabled };
  }, [showAnswer, onShowAnswer, onRate, onExit, disabled]);

  // 3. Inscrição Única (Lifecycle Isolado)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Extração com Fallback vs Optional Chaining direto da Referência
      const { showAnswer, onShowAnswer, onRate, onExit, disabled } = stateRef.current;

      // Padrão Bouncer (Guard Clause): Aborta imediatamente se estiver bloqueado
      if (disabled) return;

      if (e.key === "Escape") {
        e.preventDefault();
        if (onExit) onExit();
        return;
      }

      // Suporte simultâneo para Espaço e Enter
      if (e.key === " " || e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        if (!showAnswer) {
          onShowAnswer();
        }
        return;
      }

      // Máquina de Estados Estrita
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
          // Omitimos o bloco default: never aqui pois e.key é uma string livre, 
          // não um Enum fechado, então ignoramos qualquer outra tecla silenciosamente.
        }
      }
    };

    // A inscrição ocorre apenas UMA vez no ciclo de vida (array de dependências vazio)
    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      // O expurgo antecipado (Cleanup Estrito) ocorre apenas na desmontagem do componente
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []); // <-- O segredo contra Stale Closures e Thrashing de memória
}