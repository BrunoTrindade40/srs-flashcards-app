import { useMutation } from "@apollo/client/react";
import React from "react";
import { UPDATE_MY_SETTINGS } from "../../lib/graphql/settings";
import { useToast } from "../../hooks/useToast";
import { validateSettingsInput } from "../../domain/validators";
import type { GetMeQuery } from "../../gql/graphql";

// Extração Estrutural Estrita (Duck Typing)
type UserSettings = NonNullable<GetMeQuery["me"]>;

export const SettingsForm: React.FC<{
  initialData: UserSettings;
  onClose: () => void;
}> = ({ initialData, onClose }) => {
  const { showToast } = useToast();
  // Removido o stateful loading visual.
  const [updateSettings] = useMutation(UPDATE_MY_SETTINGS);

  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const savedTimezone = initialData.timezone || browserTimezone;
  const hasTimezoneDivergence = browserTimezone !== savedTimezone;

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Ordem de precedência lógica para coalescência de nulos
    const dailyNewCardLimit = parseInt(
      String(formData.get("dailyNewCardLimit") ?? "0"),
      10,
    );
    const maxDailyReviews = parseInt(
      String(formData.get("maxDailyReviews") ?? "0"),
      10,
    );
    const dailyRolloverTime = String(formData.get("dailyRolloverTime") ?? "");
    const timezone = String(formData.get("timezone") ?? "");

    const validationError = validateSettingsInput(
      dailyNewCardLimit,
      maxDailyReviews,
      dailyRolloverTime,
      timezone,
    );

    if (validationError !== null) {
      showToast(validationError, "error");
      return;
    }

    // Execução Otimista (0ms delay perceptível)
    updateSettings({
      variables: {
        data: {
          dailyNewCardLimit,
          maxDailyReviews,
          timezone,
          dailyRolloverTime,
        },
      },
      optimisticResponse: {
        __typename: "Mutation",
        updateMySettings: {
          __typename: "User",
          id: initialData.id,
          dailyNewCardLimit,
          maxDailyReviews,
          timezone,
          dailyRolloverTime,
        },
      },
    }).catch((err: unknown) => {
      // Regra 16: Fallback de UI Otimista Falha interceptado via bloco de promessa
      if (err instanceof Error) {
        showToast(
          `Erro de rede. A ação foi revertida: ${err.message}`,
          "error",
        );
      }
    });

    // Fechamento síncrono da tela e notificação fluida
    showToast("Configurações atualizadas!", "success");
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Novos Cartões por Dia
        </label>
        <input
          type="number"
          name="dailyNewCardLimit"
          defaultValue={initialData.dailyNewCardLimit}
          min="0"
          max="500"
          required
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-sans transition-colors"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Limite Máximo de Revisões
        </label>
        <input
          type="number"
          name="maxDailyReviews"
          defaultValue={initialData.maxDailyReviews}
          min="10"
          max="2000"
          required
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-sans transition-colors"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 border-t border-slate-800/50 pt-4 mt-2">
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Fuso Horário (Timezone)
          </label>
          <select
            name="timezone"
            defaultValue={savedTimezone}
            className={`w-full px-3 py-2.5 bg-slate-950 border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-1 appearance-none cursor-pointer transition-colors ${
              hasTimezoneDivergence
                ? "border-amber-500/50 focus:border-amber-500 focus:ring-amber-500"
                : "border-slate-800 focus:border-blue-500 focus:ring-blue-500"
            }`}
          >
            <option value={savedTimezone}>{savedTimezone}</option>
            {hasTimezoneDivergence && (
              <option value={browserTimezone}>{browserTimezone} (Atual)</option>
            )}
          </select>
          {hasTimezoneDivergence && (
            <span className="text-[10px] text-amber-500/90 leading-tight animate-fadeIn font-medium">
              Você está em um fuso diferente. Atualize para evitar o bloqueio
              prematuro ou atraso da sua fila diária.
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Horário de Virada
          </label>
          <input
            type="time"
            name="dailyRolloverTime"
            defaultValue={initialData.dailyRolloverTime || "04:00"}
            required
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-sans transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
        >
          Salvar Alterações
        </button>
      </div>
    </form>
  );
};
