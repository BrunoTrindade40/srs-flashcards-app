import React, { useState } from "react";

interface EditFlashcardModalProps {
  isOpen: boolean;
  initialFrontContent: string;
  initialBackContent: string;
  initialSourceContext?: string | null;
  onClose: () => void;
  // 🔴 CRÍTICO: Assinatura corrigida para espelhar a injeção do hook useDeckDetails
  onSave: (
    frontContent: string,
    backContent: string,
    sourceContext: string | null,
    resetProgress: boolean,
  ) => Promise<void>;
}

export const EditFlashcardModal: React.FC<EditFlashcardModalProps> = ({
  isOpen,
  initialFrontContent,
  initialBackContent,
  initialSourceContext = "",
  onClose,
  onSave,
}) => {
  const [frontContent, setFrontContent] = useState(initialFrontContent);
  const [backContent, setBackContent] = useState(initialBackContent);
  // 🟡 ALERTA: Coalescência Nula aplicada para segurança contra retornos nulos do backend
  const [sourceContext, setSourceContext] = useState(initialSourceContext ?? "");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // Padrão Bouncer logo após a declaração de Hooks
  if (!isOpen) return null;

  // Tipagem estrita de FormEvents exigida pelo React 19
  const handleFirstSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!frontContent.trim() || !backContent.trim() || loading) return;
    setStep(2); // Máquina de Estado O(1): Avança para o Modal Obrigatório da RN02
  };

  const handleFinalSubmit = async (resetProgress: boolean) => {
    try {
      setLoading(true);
      await onSave(
        frontContent.trim(),
        backContent.trim(),
        // Higienização limpa (Tolerância Zero a Undefined/Any)
        sourceContext.trim() ? sourceContext.trim() : null,
        resetProgress
      );
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 p-5 shrink-0 bg-slate-900">
          <h2 className="text-lg font-bold text-slate-100">
            {step === 1 ? "Editar Flashcard" : "Atenção: Impacto no Aprendizado"}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {step === 1 ? (
          <form onSubmit={handleFirstSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Frente (Estímulo)
              </label>
              <textarea
                value={frontContent}
                onChange={(e) => setFrontContent(e.target.value)}
                className="w-full h-28 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 resize-none font-mono"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Verso (Resposta Oculta)
              </label>
              <textarea
                value={backContent}
                onChange={(e) => setBackContent(e.target.value)}
                className="w-full h-32 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 resize-none font-mono"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Contexto de Origem / Referencial (Opcional)
              </label>
              <input
                type="text"
                value={sourceContext}
                onChange={(e) => setSourceContext(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-sans"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!frontContent.trim() || !backContent.trim()}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                Avançar
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-300 leading-relaxed">
                Você alterou o conteúdo deste cartão. Alterações significativas mudam o conceito e exigem reiniciar o agendamento cognitivo.
              </p>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2">
                <span className="text-xs font-bold text-amber-500">SE FOI UMA MUDANÇA ESTRUTURAL:</span>
                <p className="text-xs text-slate-400">Mudou o conceito primário. O histórico será limpo e o cartão voltará para a fila de "Novos".</p>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2">
                <span className="text-xs font-bold text-emerald-500">SE FOI APENAS CORREÇÃO DE ERRO:</span>
                <p className="text-xs text-slate-400">Pequenas correções ortográficas. O progresso estatístico e o agendamento atual serão preservados.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 cursor-pointer disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => handleFinalSubmit(false)}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-800/50 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? "Processando..." : "Manter Progresso"}
              </button>
              <button
                type="button"
                onClick={() => handleFinalSubmit(true)}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? "Processando..." : "Resetar Progresso"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};