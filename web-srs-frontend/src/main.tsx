import { ApolloProvider } from "@apollo/client/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Importação Nomeada Estrita garantindo coesão absoluta do escopo
import { App } from "./App";
import "./index.css";
import { client } from "./lib/apollo";

const container = document.getElementById("root");

// Padrão Bouncer e Early Return Defensivo: Tolerância Zero a '!'
if (!container) {
  throw new Error(
    "Elemento raiz 'root' não encontrado no DOM. A inicialização do React foi abortada."
  );
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </StrictMode>
);