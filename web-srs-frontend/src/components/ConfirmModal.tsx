import React from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";
// 🟢 CORRIGIDO (Regra 11): Importação tipada pura extraída do corpo do JSX
import type { ConfirmModalProps } from "./ConfirmModal.types";

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmText = "Confirmar",
  isDanger = false,
  onConfirm,
  onClose,
  loading = false,
}) => {
  // Substitui dezenas de linhas de DOM puro pela injeção coesa do Hook
  const modalRef = useFocusTrap(!loading, onClose);

  const baseButtonClass =
    "px-4 py-2.5 text-sm font-bold rounded-lg shadow-md transition-colors cursor-pointer flex items-center justify-center";

  const buttonColorClass = isDanger
    ? loading
      ? "bg-rose-900/50 text-rose-300 border border-rose-900/50 cursor-not-allowed opacity-70"
      : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/20"
    : loading
      ? "bg-indigo-900/50 text-indigo-300 border border-indigo-900/50 cursor-not-allowed opacity-70"
      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-900/20";

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col"
      >
        <div
          className={`h-1.5 w-full ${isDanger ? "bg-rose-500" : "bg-indigo-500"}`}
        ></div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{isDanger ? "⚠️" : "❓"}</span>
            <h2 className="text-lg font-extrabold text-slate-100 leading-tight">
              {title}
            </h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            {message}
          </p>
          <div className="flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-800/80 pt-5">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white font-bold rounded-lg transition-colors border border-slate-700 cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`${baseButtonClass} ${buttonColorClass}`}
            >
              {loading ? "Processando..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
