import type { ReactNode } from "react";

export interface GlobalErrorBoundaryProps {
  children: ReactNode;
}

export interface GlobalErrorBoundaryState {
  hasError: boolean;
}
