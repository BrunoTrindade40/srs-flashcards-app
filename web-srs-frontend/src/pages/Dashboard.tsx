import React from "react";
// Importação do núcleo (Framework-agnostic)
import { gql } from "@apollo/client";
// Importação estrita dos Hooks para React (Nova arquitetura v4.x)
import { useQuery } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";

interface Deck {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string;
  isArchived: boolean;
}

interface GetMyDecksData {
  myDecks: Deck[];
}

const GET_MY_DECKS = gql`
  query GetMyDecks {
    myDecks {
      id
      title
      description
      createdAt
      isArchived
    }
  }
`;

export const Dashboard: React.FC = () => {
  const navigate = useNavigate(); // Inicialize o hook
  const { data, loading, error } = useQuery<GetMyDecksData>(GET_MY_DECKS, {
    fetchPolicy: "cache-and-network",
  });

  // Arquitetura de UI baseada puramente em FlexBox
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    maxWidth: "900px",
    marginBottom: "2rem",
  };

  const listContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    width: "100%",
    maxWidth: "900px",
  };

  const cardStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.5rem",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    border: "1px solid #e4e4e7",
  };

  const cardContentStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  };

  if (loading)
    return (
      <div style={containerStyle}>
        <h2>Sincronizando conhecimento...</h2>
      </div>
    );
  if (error)
    return (
      <div style={containerStyle}>
        <h2>Erro ao carregar os Decks: {error.message}</h2>
      </div>
    );

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#18181b" }}>
          Visão Geral
        </h1>
        <button
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
          + Novo Deck
        </button>
      </header>

      <main style={listContainerStyle}>
        {!data?.myDecks || data.myDecks.length === 0 ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "3rem",
            }}
          >
            <p style={{ color: "#71717a" }}>
              Seu repositório está vazio. Crie seu primeiro Deck.
            </p>
          </div>
        ) : (
          // Tipagem explícita '(deck: Deck)' para satisfazer o strictMode do TypeScript
          data.myDecks.map((deck: Deck) => (
            <article key={deck.id} style={cardStyle}>
              <div style={cardContentStyle}>
                <h3 style={{ margin: 0, color: "#09090b" }}>{deck.title}</h3>
                <span style={{ fontSize: "0.9rem", color: "#71717a" }}>
                  {deck.description || "Sem descrição"}
                </span>
              </div>

              <div
                style={{ display: "flex", gap: "1rem", alignItems: "center" }}
              >
                <span style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>
                  {new Date(deck.createdAt).toLocaleDateString("pt-BR")}
                </span>
                <button
                  onClick={() => navigate(`/deck/${deck.id}`)}
                  style={{
                    padding: "0.5rem 1rem",
                    cursor: "pointer",
                    border: "1px solid #e4e4e7",
                    backgroundColor: "transparent",
                    borderRadius: "4px",
                  }}
                >
                  Acessar
                </button>
              </div>
            </article>
          ))
        )}
      </main>
    </div>
  );
};
export default Dashboard;
