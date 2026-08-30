import { ApolloProvider } from "@apollo/client/react";
import React, { StrictMode, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";
import { client } from "./lib/apollo";

// -----------------------------------------------------------------------------
// Componente de Contenção Genérico (Root Error Boundary)
// -----------------------------------------------------------------------------
// Como a arquitetura migrou para 'useSuspenseQuery', erros de requisição 
// irão pipocar pela árvore. Isso previne o "White Screen of Death" no React.
class GlobalErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Colapso Estrutural Raiz interceptado:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 gap-4 text-center">
          <span className="text-6xl drop-shadow-2xl">🚨</span>
          <h1 className="text-2xl font-bold text-slate-100">Falha Crítica</h1>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed">
            Nossos servidores cognitivos sofreram uma descompressão inesperada. 
            Isso geralmente ocorre por instabilidade de rede ou renovação de licenças de API.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-md cursor-pointer"
          >
            Reinicializar Malha Neural
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const container = document.getElementById("root");

if (!container) {
  throw new Error("Elemento raiz 'root' não encontrado no DOM.");
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <GlobalErrorBoundary>
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider>
    </GlobalErrorBoundary>
  </StrictMode>
);