import { useQuery } from "@apollo/client/react";
import React, { useEffect } from "react";
import { useToast } from "../hooks/useToast";
// Importação fantasma de 'ANONYMIZE_ME' eliminada com sucesso
import { GET_ME } from "../lib/graphql/settings";

import { CredentialsForm } from "./settings/CredentialsForm";
import { SettingsForm } from "./settings/SettingsForm";
import { DangerZone } from "./settings/DangerZone";

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { showToast } = useToast();
  
  const { data, loading: queryLoading, error: queryError } = useQuery(GET_ME, {
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    if (queryError) {
      showToast(`Erro ao carregar configurações: ${queryError.message}`, "error");
    }
  }, [queryError, showToast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h2 className="text-lg font-bold text-slate-100">Limites e Conta</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-sm p-1 transition-colors cursor-pointer"
          >
            ✖
          </button>
        </div>

        {queryLoading || !data?.me ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <CredentialsForm onClose={onClose} />
            <SettingsForm initialData={data.me} onClose={onClose} />
            <DangerZone onClose={onClose} />
          </div>
        )}
      </div>
    </div>
  );
};