import { useMutation } from "@apollo/client/react";
import { useCallback, useEffect, useState } from "react";
import { GET_DECK_DETAILS } from "../lib/graphql/deck";
import { CREATE_FLASHCARD } from "../lib/graphql/flashcard";
import { useToast } from "./useToast";

interface UseCreateFlashcardModalProps {
  deckId: string;
  isOpen: boolean;
  onClose: () => void;
}

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

  // Correção ALERTA: Removidos os genéricos manuais redundantes.
  // Como 'CREATE_FLASHCARD' é um TypedDocumentNode, o Apollo Client v4 infere automaticamente
  // as saídas e entradas com segurança de tipos, prevenindo o warning de depreciação.
  const [createFlashcard, { loading }] = useMutation(CREATE_FLASHCARD, {
    refetchQueries: [{ query: GET_DECK_DETAILS, variables: { id: deckId } }],
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
    if (e) {
      e.preventDefault();
    }
    if (!front.trim() || !back.trim()) {
      showToast("Preencha a Frente e o Verso do cartão.", "error");
      return;
    }

    try {
      await createFlashcard({
        variables: {
          data: {
            deckId,
            frontContent: front.trim(),
            backContent: back.trim(),
            ...(sourceContext.trim() ? { sourceContext: sourceContext.trim() } : {}),
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