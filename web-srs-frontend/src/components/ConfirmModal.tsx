import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string; // Adicionado para customizar o texto do botão
  isDanger?: boolean; // Adicionado para alternar entre azul (seguro) e vermelho (perigo)
  onConfirm: () => void;
  onClose: () => void; // Alterado de 'onCancel' para 'onClose'
  loading?: boolean; // Alterado de 'isLoading' para 'loading'
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirmar",
  isDanger = false,
  onConfirm,
  onClose,
  loading = false,
}) => {
  if (!isOpen) return null;

  // Renderização dinâmica de cores baseada na prop isDanger
  const baseButtonClass =
    "px-4 py-2 text-white font-bold rounded-lg shadow-sm transition-colors";
  const buttonColorClass = isDanger
    ? loading
      ? "bg-rose-400 cursor-not-allowed"
      : "bg-rose-600 hover:bg-rose-700"
    : loading
      ? "bg-blue-400 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
        <h2 className="text-xl font-extrabold text-slate-900 mb-2">{title}</h2>
        <p className="text-gray-600 font-medium mb-6">{message}</p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 font-bold rounded-lg transition-colors"
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
  );
};
