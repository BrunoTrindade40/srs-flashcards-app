import { useMutation, useQuery } from "@apollo/client/react";
import React, { useEffect, useState } from "react";
import { useToast } from "../hooks/useToast";
import {
  GET_ME,
  UPDATE_MY_SETTINGS,
  type UserSettings,
} from "../lib/graphql/settings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 1. COMPONENTE CONTAINER: Responsável exclusivamente por gerenciar a rede e o ciclo de vida do modal.
export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();

  const {
    data,
    loading: queryLoading,
    error: queryError,
  } = useQuery(GET_ME, {
    skip: !isOpen,
    fetchPolicy: "cache-and-network",
  });

  // Tratamento declarativo e purista de erros de query
  useEffect(() => {
    if (queryError) {
      showToast(
        `Erro ao carregar configurações: ${queryError.message}`,
        "error",
      );
    }
  }, [queryError, showToast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h2 className="text-lg font-bold text-slate-100">
              Limites e Reset Diário
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-sm p-1 transition-colors cursor-pointer"
            aria-label="Fechar Modal"
          >
            ✕
          </button>
        </div>

        {/* Body / Loading - Só renderiza o Form se os dados existirem */}
        {queryLoading || !data?.me ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <SettingsForm initialData={data.me} onClose={onClose} />
        )}
      </div>
    </div>
  );
};

// 2. COMPONENTE APRESENTADOR: Encapsula a lógica do formulário inicializando o estado de forma nativa.
interface SettingsFormProps {
  initialData: UserSettings;
  onClose: () => void;
}

const SettingsForm: React.FC<SettingsFormProps> = ({
  initialData,
  onClose,
}) => {
  const { showToast } = useToast();

  // SOLUÇÃO DO ESLINT: O estado inicializa diretamente pelo Prop sem necessitar de useEffect!
  const [dailyNewCardLimit, setDailyNewCardLimit] = useState<number | "">(
    initialData.dailyNewCardLimit,
  );
  const [maxDailyReviews, setMaxDailyReviews] = useState<number | "">(
    initialData.maxDailyReviews,
  );

  const [updateSettings, { loading: mutationLoading }] =
    useMutation(UPDATE_MY_SETTINGS);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      mutationLoading ||
      typeof dailyNewCardLimit !== "number" ||
      typeof maxDailyReviews !== "number"
    )
      return;

    try {
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      await updateSettings({
        variables: {
          data: {
            dailyNewCardLimit,
            maxDailyReviews,
            timezone: browserTimezone,
          },
        },
      });

      // Fluxo Linear Assíncrono (KISS) - Sem depender de callbacks obsoletos
      showToast("Configurações e Fuso Horário atualizados!", "success");
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Falha ao salvar configurações: ${err.message}`, "error");
      } else {
        showToast("Falha inesperada ao salvar configurações.", "error");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Novos Cartões por Dia
        </label>
        <input
          type="number"
          min="0"
          max="500"
          value={dailyNewCardLimit}
          onChange={(e) =>
            setDailyNewCardLimit(e.target.value ? Number(e.target.value) : "")
          }
          disabled={mutationLoading}
          required
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
        />
        <p className="text-[10px] text-slate-500">
          Quantidade máxima de conteúdos inéditos inseridos nas suas revisões
          diárias.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Limite Máximo de Revisões
        </label>
        <input
          type="number"
          min="10"
          max="2000"
          value={maxDailyReviews}
          onChange={(e) =>
            setMaxDailyReviews(e.target.value ? Number(e.target.value) : "")
          }
          disabled={mutationLoading}
          required
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
        />
        <p className="text-[10px] text-slate-500">
          Trava de segurança para evitar <i>Burnout</i> em dias de alta carga
          (Ex: 100).
        </p>
      </div>

      {/* Explicação do Fuso Horário */}
      <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 mt-1">
        <span className="text-amber-400 mt-0.5">ℹ️</span>
        <p className="text-[11px] text-amber-200/80 leading-relaxed font-medium">
          Seu fuso horário (
          <b>{Intl.DateTimeFormat().resolvedOptions().timeZone}</b>) será
          sincronizado automaticamente com o servidor para garantir que a virada
          do dia para seus estudos ocorra exatamente à sua meia-noite local.
        </p>
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
        <button
          type="button"
          onClick={onClose}
          disabled={mutationLoading}
          className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={
            mutationLoading ||
            dailyNewCardLimit === "" ||
            maxDailyReviews === ""
          }
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
        >
          {mutationLoading ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </form>
  );
};
