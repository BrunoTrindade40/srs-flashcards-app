import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react"; // A sua correção manual aplicada
import React, { useState } from "react";

// 1. Contratos Estritos da Mutação
interface Deck {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string;
  isArchived: boolean;
}

interface CreateDeckData {
  createDeck: Deck;
}

interface CreateDeckVars {
  data: {
    title: string;
    description?: string | null;
  };
}

const CREATE_DECK_MUTATION = gql`
  mutation CreateDeck($data: CreateDeckInput!) {
    createDeck(data: $data) {
      id
      title
      description
      createdAt
      isArchived
    }
  }
`;

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateDeckModal: React.FC<CreateDeckModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // 2. Injeção de Generics: O TS agora sabe exatamente o formato de 'data' e 'variables'
  const [createDeck, { loading }] = useMutation<CreateDeckData, CreateDeckVars>(
    CREATE_DECK_MUTATION,
    {
      update(cache, { data }) {
        // Barreira de segurança para garantir que a mutação retornou dados válidos
        if (!data) return;

        cache.modify({
          fields: {
            myDecks(existingDecks = []) {
              const newDeckRef = cache.writeFragment({
                data: data.createDeck, // Acesso 100% seguro reconhecido pelo compilador
                fragment: gql`
                  fragment NewDeck on Deck {
                    id
                    title
                    description
                    createdAt
                    isArchived
                  }
                `,
              });
              return [newDeckRef, ...existingDecks];
            },
          },
        });
      },
      onCompleted: () => {
        setTitle("");
        setDescription("");
        onClose();
      },
    },
  );

  // 3. Resolução do Deprecated: Utilização do manipulador de eventos explícito do React 19
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createDeck({
      variables: {
        data: {
          title,
          description: description || null,
        },
      },
    });
  };

  if (!isOpen) return null;

  // 4. Arquitetura Visual (Flexbox Puro)
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
    width: "400px",
    backgroundColor: "#ffffff",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ margin: 0, color: "#09090b" }}>Novo Deck</h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <label
              htmlFor="title"
              style={{
                fontSize: "0.9rem",
                fontWeight: "bold",
                color: "#18181b",
              }}
            >
              Título
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Padrões de Arquitetura"
              required
              style={{
                padding: "0.75rem",
                borderRadius: "4px",
                border: "1px solid #d4d4d8",
                fontSize: "1rem",
              }}
            />
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <label
              htmlFor="description"
              style={{
                fontSize: "0.9rem",
                fontWeight: "bold",
                color: "#18181b",
              }}
            >
              Descrição (Opcional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                padding: "0.75rem",
                borderRadius: "4px",
                border: "1px solid #d4d4d8",
                resize: "none",
                fontSize: "1rem",
                fontFamily: "inherit",
              }}
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
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
