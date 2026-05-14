import { ApolloProvider } from "@apollo/client/react"; // Importação atualizada para a v4
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { client } from "./lib/apollo";
import { AppRoutes } from "./routes";

const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <ApolloProvider client={client}>
      <AppRoutes />
    </ApolloProvider>
  </StrictMode>,
);
