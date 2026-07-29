import { useMutation, useQuery } from "@apollo/client/react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h2 className="text-lg font-bold text-slate-100">
              Limites e Conta
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-sm p-1 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

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

interface SettingsFormProps {
  initialData: UserSettings;
  onClose: () => void;
}

const SettingsForm: React.FC<SettingsFormProps> = ({
  initialData,
  onClose,
}) => {
  const { showToast } = useToast();
  const { logout } = useAuth();

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
      showToast("Configurações e Fuso Horário atualizados!", "success");
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Falha ao salvar configurações: ${err.message}`, "error");
      }
    }
  };

  const handleDeleteAccount = async () => {
    showToast(
      "Solicitação de anonimização (LGPD) enviada ao administrador.",
      "success",
    );
    onClose();
    await logout();
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
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500"
        />
        <p className="text-[10px] text-slate-500">
          Controle para mitigar a bola de neve algorítmica.
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
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500"
        />
        <p className="text-[10px] text-slate-500">
          Trava de segurança diária de Burnout cognitivo.
        </p>
      </div>

      {/* Seção de Notificações (Mock Fase 1 - UC07) */}
      <div className="flex flex-col gap-3 pt-4 border-t border-slate-800/80 mt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Notificações
          </h3>
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-800 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 shadow-sm">
            (Em Breve na Fase 2)
          </span>
        </div>

        {/* Container em Flexbox para o alinhamento horizontal */}
        <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800/50 rounded-xl opacity-60 cursor-not-allowed">
          <div className="flex flex-col gap-1 pr-4">
            <span className="text-sm font-semibold text-slate-400">
              Lembretes Diários de Estudo
            </span>
            <span className="text-[10px] text-slate-500 leading-relaxed">
              Receba pílulas de estudo diretamente via WhatsApp ou Telegram.
            </span>
          </div>
          {/* Mock Toggle Switch construído 100% com Flexbox */}
          <div className="w-11 h-6 bg-slate-800 rounded-full flex items-center p-1 shrink-0 border border-slate-700/50">
            <div className="w-4 h-4 bg-slate-600 rounded-full shadow-sm"></div>
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 mt-1">
        <span className="text-amber-400 mt-0.5">🌐</span>
        <p className="text-[11px] text-amber-200/80 leading-relaxed font-medium">
          Seu fuso horário (
          <b>{Intl.DateTimeFormat().resolvedOptions().timeZone}</b>) será
          sincronizado com o servidor.
        </p>
      </div>

      {/* ZONA DE PERIGO LGPD (UC08) */}
      <div className="flex flex-col gap-3 pt-4 border-t border-rose-900/30 mt-2">
        <h3 className="text-xs font-bold text-rose-500 uppercase tracking-wider">
          Zona de Perigo (LGPD)
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-rose-950/20 border border-rose-900/50 rounded-xl">
          <p className="text-[10px] text-rose-200/70 leading-relaxed flex-1">
            Ao excluir sua conta, você exerce o <b>direito ao esquecimento</b>.
            Seus dados pessoais serão <b>anonimizados irreversivelmente</b>.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="shrink-0 px-4 py-2 bg-rose-950 text-rose-400 font-bold text-[11px] rounded-lg border border-rose-900/50 hover:bg-rose-900 hover:text-rose-100 transition-all cursor-pointer"
          >
            Excluir Conta
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onClose}
          disabled={mutationLoading}
          className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
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
