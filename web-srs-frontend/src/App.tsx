import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";

const App: React.FC = () => {
  // Estilização estrutural utilizando propriedades puras do Flexbox
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    backgroundColor: "#f4f4f5",
    fontFamily: "sans-serif",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };

  const mainContentStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    flex: 1, // Preenche o espaço restante da tela
    padding: "2rem",
    alignItems: "center", // Centraliza o conteúdo (Decks/Flashcards)
  };

  return (
    <BrowserRouter>
      <AppRoutes />
      <div style={containerStyle}>
        <header style={headerStyle}>
          <h2>SRS Flashcards</h2>
          <button style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
            Sair
          </button>
        </header>

        <main style={mainContentStyle}>
          <div style={{ width: "100%", maxWidth: "800px" }}>
            <h3>Meus Decks</h3>
            {/* O componente de listagem de Decks será injetado aqui */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              <p>Carregando repositório de conhecimento...</p>
            </div>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
