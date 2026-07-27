import { createContext } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface ToastContextData {
  showToast: (message: string, type?: ToastType) => void;
}

// Inicializado com null, sem gambiarras de tipagem, apenas lógica pura.
export const ToastContext = createContext<ToastContextData | null>(null);