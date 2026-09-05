import { useEffect, useRef } from "react";

export function useFocusTrap(isActive: boolean = true, onEscape?: () => void) {
  const trapRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Type Guard Seguro em vez do perigoso "as HTMLElement"
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      previousFocusRef.current = activeElement;
    }

    const focusableElementsString =
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';

    const getFocusableNodes = (): HTMLElement[] => {
      if (!trapRef.current) return [];

      // Filtro com Type Predicate garantindo HTMLElements verdadeiros
      return Array.from(
        trapRef.current.querySelectorAll(focusableElementsString),
      ).filter((node): node is HTMLElement => node instanceof HTMLElement);
    };

    const initialNodes = getFocusableNodes();
    if (initialNodes.length > 0) {
      initialNodes[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      if (e.key === "Tab") {
        const nodes = getFocusableNodes();
        if (nodes.length === 0) return;

        const firstTabStop = nodes[0];
        const lastTabStop = nodes[nodes.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstTabStop) {
            e.preventDefault();
            lastTabStop.focus();
          }
        } else {
          if (document.activeElement === lastTabStop) {
            e.preventDefault();
            firstTabStop.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      // Correção: Operador de Encadeamento Opcional Absoluto.
      // O compilador validará a existência da referência ANTES de fatiar o método focus() na árvore do Web API.
      previousFocusRef.current?.focus();
    };
  }, [isActive, onEscape]);

  return trapRef;
}
