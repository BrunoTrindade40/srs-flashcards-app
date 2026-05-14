import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react"; // Importação estrita da v4
import React, { useState } from "react";

// Contrato GraphQL para a mutação
const CREATE_DECK = gql`
  mutation CreateDeck($data: CreateDeckInput!) {
    createDeck(data: $data) {
      id
      title
      description
      targetLanguage
      createdAt
    }
  }
`;

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateDeckModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateDeckModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");

  // A mutação é configurada para recarregar a query 'GetMyDecks' automaticamente após o sucesso
  const [createDeck, { loading, error }] = useMutation(CREATE_DECK, {
    refetchQueries: ["GetMyDecks"],
    onCompleted: () => {
      setTitle("");
      setDescription("");
      setTargetLanguage("");
      onSuccess();
    },
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createDeck({
      variables: {
        data: {
          title,
          description: description || null,
          targetLanguage: targetLanguage || null,
        },
      },
    });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2>Novo Deck</h2>
          <button style={styles.closeButton} onClick={onClose} type="button">
            X
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Título do Deck *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
              placeholder="Ex: Vocabulário de Inglês"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Descrição (Opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...styles.input, resize: "vertical", minHeight: "80px" }}
              placeholder="Ex: Termos essenciais para viagens..."
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Idioma Alvo (Opcional)</label>
            <input
              type="text"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              style={styles.input}
              placeholder="Ex: en-US, de-DE"
            />
          </div>

          {error && (
            <div style={styles.errorMessage}>Erro: {error.message}</div>
          )}

          <div style={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={loading}
            >
              {loading ? "A salvar..." : "Criar Deck"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Estilização estrita com Flexbox
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#FFF",
    borderRadius: "12px",
    padding: "2rem",
    width: "100%",
    maxWidth: "500px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "1.25rem",
    cursor: "pointer",
    color: "#666",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#333",
  },
  input: {
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid #CCC",
    fontSize: "1rem",
    fontFamily: "inherit",
  },
  errorMessage: {
    color: "#D32F2F",
    backgroundColor: "#FFEBEE",
    padding: "0.75rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem",
    marginTop: "1rem",
  },
  cancelButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#E0E0E0",
    color: "#333",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  submitButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#007BFF",
    color: "#FFF",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
