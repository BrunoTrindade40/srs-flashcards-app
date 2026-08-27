// src/hooks/useCreateFlashcardModal.ts
import { useMutation } from "@apollo/client/react";
import { useCallback, useEffect, useState } from "react";
import { CREATE_FLASHCARD } from "../lib/graphql/flashcard";
import { useToast } from "./useToast";
import type { Reference } from "@apollo/client/core";
// CORREÇÃO CRÍTICA: Importando a Única Fonte da Verdade do domínio
import { validateFlashcardInput } from "../domain/validators";

interface UseCreateFlashcardModalProps {
  deckId: string;
  onClose: () => void;
}

export function useCreateFlashcardModal({
  deckId,
  onClose,
}: UseCreateFlashcardModalProps) {
  const { showToast } = useToast();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [sourceContext, setSourceContext] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Mutações Apollo e Manipulação O(1) de cache mantidas.
  const [createFlashcard, { loading }] = useMutation(CREATE_FLASHCARD, {
    update(cache, { data: mutationData }) {
      if (!mutationData?.createFlashcard) return;
      
      const deckCacheId = cache.identify({ __typename: "Deck", id: deckId });
      
      cache.modify({
        id: deckCacheId,
        fields: {
          flashcards(existingRefs: readonly Reference[] = [], { toReference }) {
            const newCardRef = toReference(mutationData.createFlashcard);
            if (!newCardRef) return existingRefs;
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  const handleSubmit = async (e?: React.SyntheticEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    
    // Padrão Bouncer acionando o validador de domínio externo (SSOT)
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
            // Higienização limpa para Coalescência de Backend
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