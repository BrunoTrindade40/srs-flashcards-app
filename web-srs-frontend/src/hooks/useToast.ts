import { useContext } from "react";
import { ToastContext, type ToastContextData } from "../context/ToastContext";

export function useToast(): ToastContextData {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast deve ser utilizado dentro de um ToastProvider");
  }

  return context;
}