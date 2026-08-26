import { useMutation } from "@apollo/client/react";
import { useCallback, useEffect, useState } from "react";
import { CREATE_FLASHCARD } from "../lib/graphql/flashcard";
import { useToast } from "./useToast";
import type { Reference } from "@apollo/client/core";

interface UseCreateFlashcardModalProps {
  deckId: string;
  isOpen: boolean;
  onClose: () => void;
}

// 1. Função Pura de Validação (O Padrão "Zod Nativo")
// Isolada do React, altamente testável e livre de efeitos colaterais.
// Funciona como um esquema de validação estrutural "early-fail".
const validateFlashcardInput = (front: string, back: string, source: string): string | null => {
  const safeFront = front.trim();
  const safeBack = back.trim();
  const safeSource = source.trim();

  // Validação da Frente
  if (!safeFront) return "A Frente do cartão é obrigatória.";
  if (safeFront.length < 2) return "A Frente precisa ter no mínimo 2 caracteres.";
  if (safeFront.length > 2000) return "A Frente excedeu o limite de segurança (2000 caracteres).";
  
  // Validação do Verso
  if (!safeBack) return "O Verso do cartão é obrigatório.";
  if (safeBack.length < 2) return "O Verso precisa ter no mínimo 2 caracteres.";
  if (safeBack.length > 3000) return "O Verso excedeu o limite de segurança (3000 caracteres).";

  // Validação do Contexto de Origem (Campo Opcional)
  if (safeSource && safeSource.length > 255) {
    return "O Contexto de Origem não pode exceder 255 caracteres.";
  }

  // Nullish Coalescing amigável: null significa "Aprovado sem erros"
  return null; 
};

export function useCreateFlashcardModal({
  deckId,
  isOpen,
  onClose,
}: UseCreateFlashcardModalProps) {
  const { showToast } = useToast();

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [sourceContext, setSourceContext] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // CORREÇÃO DE OVERFETCHING: Substituição do refetchQueries pela mutação imutável O(1) local.
  const [createFlashcard, { loading }] = useMutation(CREATE_FLASHCARD, {
    update(cache, { data: mutationData }) {
      if (!mutationData?.createFlashcard) return;

      // Identifica o deck raiz na RAM do Apollo
      const deckCacheId = cache.identify({ __typename: "Deck", id: deckId });
      
      cache.modify({
        id: deckCacheId,
        fields: {
          flashcards(existingRefs: readonly Reference[] = [], { toReference }) {
            const newCardRef = toReference(mutationData.createFlashcard);
            if (!newCardRef) return existingRefs;
            // Spread operator garante a anexação imutável ao array do Deck
            return [...existingRefs, newCardRef];
          },
        },
      });
    }
  });
  const resetForm = useCallback(() => {
    setFront("");
    setBack("");
    setSourceContext("");
    setIsPreviewMode(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  const handleSubmit = async (e?: React.SyntheticEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    
    const validationError = validateFlashcardInput(front, back, sourceContext);
    if (validationError) {
      showToast(validationError, "error");
      return; 
    }

    try {
      await createFlashcard({
        variables: {
          data: {
            deckId,
            frontContent: front.trim(),
            backContent: back.trim(),
            sourceContext: sourceContext.trim() ? sourceContext.trim() : null,
          },
        },
      });
      
      showToast("Flashcard criado com sucesso!", "success");
      handleClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro ao criar flashcard: ${err.message}`, "error");
      }
    }
  };

  return {
    front,
    setFront,
    back,
    setBack,
    sourceContext,
    setSourceContext,
    isPreviewMode,
    setIsPreviewMode,
    loading,
    handleSubmit,
    handleClose,
  };
}