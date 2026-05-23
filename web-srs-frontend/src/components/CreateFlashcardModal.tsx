import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import React, { useState } from "react";

// 1. Contratos Estritos da Mutação
interface Flashcard {
  id: string;
  front: string;
  back: string;
  createdAt: string;
}

interface CreateFlashcardData {
  createFlashcard: Flashcard;
}

interface CreateFlashcardVars {
  data: {
    deckId: string;
    front: string;
    back: string;
  };
}

const CREATE_FLASHCARD_MUTATION = gql`
  mutation CreateFlashcard($data: CreateFlashcardInput!) {
    createFlashcard(data: $data) {
      id
      front
      back
      createdAt
    }
  }
`;

interface CreateFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckId: string;
}

export const CreateFlashcardModal: React.FC<CreateFlashcardModalProps> = ({
  isOpen,
  onClose,
  deckId,
}) => {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  // 2. Execução da Mutação e Atualização do Cache Local (Sem Refetch)
  const [createFlashcard, { loading }] = useMutation<
    CreateFlashcardData,
    CreateFlashcardVars
  >(CREATE_FLASHCARD_MUTATION, {
    update(cache, { data }) {
      if (!data) return;

      // Identificamos o Deck específico no Cache do Apollo
      const deckCacheId = cache.identify({ __typename: "Deck", id: deckId });

      cache.modify({
        id: deckCacheId,
        fields: {
          // Modificamos apenas o array de flashcards deste Deck
          flashcards(existingFlashcards = []) {
            const newFlashcardRef = cache.writeFragment({
              data: data.createFlashcard,
              fragment: gql`
                fragment NewFlashcard on Flashcard {
                  id
                  front
                  back
                  createdAt
                }
              `,
            });
            // Adicionamos o novo cartão ao final da lista
            return [...existingFlashcards, newFlashcardRef];
          },
        },
      });
    },
    onCompleted: () => {
      setFront("");
      setBack("");
      onClose();
    },
  });

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;

    await createFlashcard({
      variables: {
        data: {
          deckId,
          front,
          back,
        },
      },
    });
  };

  if (!isOpen) return null;

  // 3. UI Estritamente Baseada em Flexbox
  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    width: "500px",
    backgroundColor: "#ffffff",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.9rem",
    fontWeight: "bold",
    color: "#18181b",
  };
  const inputStyle: React.CSSProperties = {
    padding: "0.75rem",
    borderRadius: "4px",
    border: "1px solid #d4d4d8",
    fontSize: "1rem",
    fontFamily: "inherit",
    resize: "vertical",
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ margin: 0, color: "#09090b" }}>Novo Flashcard</h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <label htmlFor="front" style={labelStyle}>
              Frente (Pergunta / Estímulo)
            </label>
            <textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              rows={3}
              placeholder="Ex: O que é o Efeito de Espaçamento?"
              required
              style={inputStyle}
            />
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <label htmlFor="back" style={labelStyle}>
              Verso (Resposta / Explicação)
            </label>
            <textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={4}
              placeholder="Ex: Fenômeno cognitivo onde a retenção melhora quando as revisões são distribuídas ao longo do tempo."
              required
              style={inputStyle}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              marginTop: "0.5rem",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.5rem 1rem",
                cursor: "pointer",
                border: "1px solid #d4d4d8",
                backgroundColor: "transparent",
                borderRadius: "4px",
                fontWeight: "500",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "0.5rem 1rem",
                cursor: "pointer",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                fontWeight: "500",
              }}
            >
              {loading ? "Salvando..." : "Adicionar Cartão"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
