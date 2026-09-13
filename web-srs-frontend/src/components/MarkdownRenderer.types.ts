import type { ReactNode } from "react";

export interface ErrorBoundaryProps {
  children: ReactNode;
} // 🔴 CORRIGIDO: Chave de fechamento restaurada

export interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
} // 🔴 CORRIGIDO: Chave de fechamento restaurada

export interface MarkdownRendererProps {
  content: string;
  className?: string;
} // 🔴 CORRIGIDO: Chave de fechamento restaurada
