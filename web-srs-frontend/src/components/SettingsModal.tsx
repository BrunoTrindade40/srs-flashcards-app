import { useMutation, useQuery } from "@apollo/client/react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

import type {
  GetSettingsResponse,
  UpdateSettingsResponse,
  UpdateSettingsVariables,
} from "../lib/graphql/settings";
import { GET_SETTINGS, UPDATE_SETTINGS } from "../lib/graphql/settings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserSettingsData {
  dailyNewCardLimit: number;
  maxDailyReviews: number;
}

// --- 1. COMPONENTE FILHO: ISOLAMENTO DO FORMULÁRIO ---
const SettingsForm: React.FC<{
  initialData: UserSettingsData;
  onClose: () => void;
}> = ({ initialData, onClose }) => {
  const navigate = useNavigate();

  const [dailyNewCardLimit, setDailyNewCardLimit] = useState<number>(
    initialData.dailyNewCardLimit,
  );
  const [maxDailyReviews, setMaxDailyReviews] = useState<number>(
    initialData.maxDailyReviews,
  );

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [updateSettings, { loading: isSaving }] = useMutation<
    UpdateSettingsResponse,
    UpdateSettingsVariables
  >(UPDATE_SETTINGS, {
    update(cache, { data }) {
      if (!data?.updateMySettings) return;
      cache.writeQuery<GetSettingsResponse>({
        query: GET_SETTINGS,
        data: { me: data.updateMySettings },
      });
    },
  });

  // CORREÇÃO: Substituição de FormEventHandler por SubmitEventHandler
  const handleSaveSettings: React.SubmitEventHandler<HTMLFormElement> = async (
    e,
  ) => {
    e.preventDefault();
    setServerError(null);

    try {
      await updateSettings({
        variables: {
          data: {
            dailyNewCardLimit,
            maxDailyReviews,
          },
        },
      });
      onClose();
    } catch (error) {
      console.error("Falha ao sincronizar as configurações:", error);
      setServerError(
        "Ocorreu um erro ao comunicar com o servidor. Tente novamente.",
      );
    }
  };

  const handleIrreversibleAnonymization = async () => {
    const confirmed = window.confirm(
      "Atenção: Esta ação iniciará o processo de Anonimização Irreversível dos seus dados. Você perderá o acesso à conta e ao histórico de estudos permanentemente. Deseja prosseguir?",
    );

    if (confirmed) {
      setIsProcessing(true);
      try {
        await supabase.auth.signOut();
        navigate("/login");
      } catch (error) {
        console.error("Falha ao processar a anonimização:", error);
        alert("Ocorreu um erro ao processar a solicitação.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <>
      {serverError && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-100">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-extrabold text-blue-700 uppercase tracking-widest">
            Limites de Estudo Diário
          </h3>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="dailyNewCardLimit"
              className="text-sm font-bold text-gray-700"
            >
              Limite Diário de Novos Cartões
            </label>
            <input
              id="dailyNewCardLimit"
              type="number"
              min="1"
              max="100"
              value={dailyNewCardLimit}
              onChange={(e) => setDailyNewCardLimit(Number(e.target.value))}
              disabled={isSaving}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
            <p className="text-xs text-gray-500 font-medium">
              Define a quantidade máxima de cartões inéditos introduzidos por
              dia.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="maxDailyReviews"
              className="text-sm font-bold text-gray-700"
            >
              Limite Máximo de Revisões
            </label>
            <input
              id="maxDailyReviews"
              type="number"
              min="10"
              max="1000"
              value={maxDailyReviews}
              onChange={(e) => setMaxDailyReviews(Number(e.target.value))}
              disabled={isSaving}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
            <p className="text-xs text-gray-500 font-medium">
              Teto diário de revisões para evitar sobrecarga cognitiva
              (Burnout).
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-extrabold text-red-700 uppercase tracking-widest">
            Privacidade e Segurança
          </h3>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-red-50 p-4 rounded-xl border border-red-100">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-slate-900">
                Encerrar Conta
              </span>
              <span className="text-xs text-gray-700 font-medium">
                Remove permanentemente seus dados do sistema.
              </span>
            </div>
            <button
              type="button"
              onClick={handleIrreversibleAnonymization}
              disabled={isProcessing || isSaving}
              className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-red-700 transition-colors whitespace-nowrap"
            >
              {isProcessing ? "Processando..." : "Anonimização Irreversível"}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 font-bold rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`px-5 py-2.5 text-white font-bold rounded-lg shadow-sm transition-colors ${
              isSaving
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </>
  );
};

// --- 2. COMPONENTE PAI: GERENCIADOR DA SOBREPOSIÇÃO E FETCH ---
export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data, loading, error } = useQuery<GetSettingsResponse>(GET_SETTINGS, {
    skip: !isOpen,
    fetchPolicy: "cache-first",
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-2xl font-extrabold text-slate-900">
            Configurações
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 font-bold text-2xl transition-colors"
          >
            &times;
          </button>
        </div>

        {loading ? (
          <div className="flex py-12 justify-center items-center">
            <p className="text-gray-600 font-bold">
              Sincronizando preferências...
            </p>
          </div>
        ) : error ? (
          <div className="mb-4 p-4 bg-red-50 text-red-700 font-medium text-sm rounded-lg border border-red-100">
            Não foi possível carregar os seus dados de configuração no momento.
          </div>
        ) : data?.me ? (
          <SettingsForm initialData={data.me} onClose={onClose} />
        ) : null}
      </div>
    </div>
  );
};
