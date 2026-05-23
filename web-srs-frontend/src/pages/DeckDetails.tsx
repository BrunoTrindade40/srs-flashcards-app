import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CreateFlashcardModal } from "../components/CreateFlashcardModal";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  createdAt: string;
}

interface GetDeckDetailsData {
  deck: {
    id: string;
    title: string;
    description?: string | null;
    flashcards: Flashcard[];
  };
}

interface GetDeckDetailsVars {
  id: string;
}

const GET_DECK_DETAILS = gql`
  query GetDeckDetails($id: String!) {
    deck(id: $id) {
      id
      title
      description
      flashcards {
        id
        front
        back
        createdAt
      }
    }
  }
`;

export const DeckDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Estado de controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, loading, error } = useQuery<
    GetDeckDetailsData,
    GetDeckDetailsVars
  >(GET_DECK_DETAILS, {
    variables: { id: id! },
    skip: !id,
    fetchPolicy: "cache-and-network",
  });

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    padding: "2rem",
    boxSizing: "border-box",
  };
  const headerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    width: "100%",
    maxWidth: "900px",
    marginBottom: "2rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid #e4e4e7",
  };
  const listContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    width: "100%",
    maxWidth: "900px",
  };
  const flashcardStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    padding: "1.5rem",
    backgroundColor: "#fafafa",
    borderRadius: "8px",
    border: "1px solid #e4e4e7",
  };

  if (loading)
    return (
      <div style={containerStyle}>
        <h2>Carregando Flashcards...</h2>
      </div>
    );
  if (error)
    return (
      <div style={containerStyle}>
        <h2>Erro: {error.message}</h2>
      </div>
    );
  if (!data?.deck)
    return (
      <div style={containerStyle}>
        <h2>Deck não encontrado.</h2>
      </div>
    );

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <button
              onClick={() => navigate(-1)}
              style={{
                marginBottom: "1rem",
                cursor: "pointer",
                background: "none",
                border: "none",
                color: "#2563eb",
                fontWeight: "bold",
                padding: 0,
              }}
            >
              ← Voltar
            </button>
            <h1 style={{ margin: 0, fontSize: "1.75rem", color: "#18181b" }}>
              {data.deck.title}
            </h1>
            <p style={{ margin: "0.5rem 0 0 0", color: "#71717a" }}>
              {data.deck.description}
            </p>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              style={{
                padding: "0.5rem 1rem",
                cursor: "pointer",
                backgroundColor: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                fontWeight: "bold",
              }}
            >
              Estudar Deck
            </button>
            {/* Gatilho para abrir o Modal */}
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                padding: "0.5rem 1rem",
                cursor: "pointer",
                backgroundColor: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                fontWeight: "bold",
              }}
            >
              + Novo Flashcard
            </button>
          </div>
        </div>
      </header>

      <main style={listContainerStyle}>
        {data.deck.flashcards.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "3rem", color: "#71717a" }}
          >
            Nenhum flashcard cadastrado neste deck.
          </div>
        ) : (
          data.deck.flashcards.map((card) => (
            <article key={card.id} style={flashcardStyle}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    color: "#a1a1aa",
                    textTransform: "uppercase",
                  }}
                >
                  Frente
                </span>
                <p
                  style={{
                    margin: 0,
                    color: "#18181b",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {card.front}
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  paddingTop: "0.75rem",
                  borderTop: "1px dashed #d4d4d8",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    color: "#a1a1aa",
                    textTransform: "uppercase",
                  }}
                >
                  Verso
                </span>
                <p
                  style={{
                    margin: 0,
                    color: "#18181b",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {card.back}
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "0.5rem",
                }}
              >
                <button
                  style={{
                    padding: "0.25rem 0.5rem",
                    cursor: "pointer",
                    border: "none",
                    backgroundColor: "#fee2e2",
                    color: "#b91c1c",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                  }}
                >
                  Excluir
                </button>
              </div>
            </article>
          ))
        )}
      </main>

      {/* Injeção do Componente Modal */}
      <CreateFlashcardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        deckId={data.deck.id}
      />
    </div>
  );
};
