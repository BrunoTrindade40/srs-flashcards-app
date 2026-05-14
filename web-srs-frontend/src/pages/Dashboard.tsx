import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateDeckModal } from "../components/CreateDeckModal"; // Importação do Modal

const GET_MY_DECKS = gql`
  query GetMyDecks {
    myDecks {
      id
      title
      description
      targetLanguage
      createdAt
    }
  }
`;

interface Deck {
  id: string;
  title: string;
  description: string | null;
  targetLanguage: string | null;
  createdAt: string;
}

export default function Dashboard() {
  const { loading, error, data } = useQuery<{ myDecks: Deck[] }>(GET_MY_DECKS);
  const navigate = useNavigate();

  // Estado para controle de visibilidade do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading)
    return (
      <div style={styles.centerContainer}>A carregar os seus decks...</div>
    );
  if (error)
    return (
      <div style={styles.centerContainer}>
        Erro ao carregar os dados: {error.message}
      </div>
    );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Os Meus Decks</h1>
        {/* Disparo de abertura do Modal */}
        <button
          style={styles.primaryButton}
          onClick={() => setIsModalOpen(true)}
        >
          + Novo Deck
        </button>
      </header>

      <div style={styles.listContainer}>
        {data?.myDecks.length === 0 ? (
          <div style={styles.emptyState}>
            <p>Ainda não possui nenhum deck. Crie um para começar!</p>
          </div>
        ) : (
          data?.myDecks.map((deck) => (
            <div
              key={deck.id}
              style={styles.card}
              onClick={() => navigate(`/deck/${deck.id}`)}
            >
              <h3 style={styles.cardTitle}>{deck.title}</h3>
              {deck.description && (
                <p style={styles.cardDescription}>{deck.description}</p>
              )}
              <div style={styles.cardFooter}>
                <span style={styles.badge}>
                  {deck.targetLanguage || "Geral"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Renderização condicional gerenciada pelo componente */}
      <CreateDeckModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setIsModalOpen(false)}
      />
    </div>
  );
}

// Estilos Flexbox mantidos e aprimorados para a listagem
const styles: Record<string, React.CSSProperties> = {
  centerContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    width: "100%",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    padding: "2rem",
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
  },
  primaryButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#007BFF",
    color: "#FFF",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  listContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1.5rem",
    width: "100%",
  },
  emptyState: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    padding: "4rem",
    backgroundColor: "#FFF",
    borderRadius: "12px",
    color: "#666",
    border: "1px dashed #CCC",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    width: "calc(33.333% - 1rem)",
    minWidth: "280px",
    padding: "1.5rem",
    backgroundColor: "#FFF",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  cardTitle: {
    fontSize: "1.25rem",
    marginBottom: "0.5rem",
  },
  cardDescription: {
    color: "#666",
    flexGrow: 1,
    marginBottom: "1rem",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "flex-start",
  },
  badge: {
    padding: "0.25rem 0.75rem",
    backgroundColor: "#E0E0E0",
    borderRadius: "16px",
    fontSize: "0.875rem",
    fontWeight: "500",
  },
};
