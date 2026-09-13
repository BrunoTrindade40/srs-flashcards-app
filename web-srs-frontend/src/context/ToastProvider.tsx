import React, {
  useCallback,
  useState,
  useMemo,
  type PropsWithChildren,
} from "react";
import { ToastContext, type Toast, type ToastType } from "./ToastContext";

export const ToastProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    // Math.random envelopado de forma pura perante o Handler, preservando a imutabilidade do DOM Principal
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  // CORREÇÃO: Consumo enxuto direto do objeto de Contexto (Padrão React 19)
  return (
    <ToastContext value={contextValue}>
      {children}

      {/* 
        Container fixo para Toasts operando apenas via Flexbox (UI01).
        CORREÇÃO a11y: Injeção de aria-live="polite" informando mudanças aos Screen Readers
        de forma não invasiva e orgânica ao navegador.
      */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-200 ${
              toast.type === "error"
                ? "bg-rose-950/90 border-rose-500/40 text-rose-200"
                : toast.type === "success"
                  ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
                  : "bg-slate-900/90 border-slate-700/60 text-slate-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">
                {toast.type === "error"
                  ? "❌"
                  : toast.type === "success"
                    ? "✅"
                    : "ℹ️"}
              </span>
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 text-xs opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Fechar notificação"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  );
};
