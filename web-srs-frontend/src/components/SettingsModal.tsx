import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { supabase } from "../lib/supabaseClient";
import {
  ANONYMIZE_ME,
  GET_ME,
  UPDATE_MY_SETTINGS,
} from "../lib/graphql/settings";
import type { GetMeQuery } from "../gql/graphql";

// APLICADO: Importação das funções puras isoladas no diretório de domínio (SSOT)
import { 
  validateCredentialsInput, 
  validateSettingsInput 
} from "../domain/validators";

// Extração Estrutural (Duck Typing Nativo)
type UserSettings = NonNullable<GetMeQuery["me"]>;

interface SettingsModalProps {
  onClose: () => void;
}

// O Componente Pai atua EXCLUSIVAMENTE como Orquestrador de UI (SRP)
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
      {/* ... marcação flexbox do Modal preservada ... */}
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
            ✕
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

// ----------------------------------------------------------------------
// Subcomponente: Atualização de Credenciais (RF16)
// ----------------------------------------------------------------------
const CredentialsForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    // Padrão Bouncer invocado com Função Pura
    const validationError = validateCredentialsInput(email, password);
    if (validationError) {
      showToast(validationError, "error");
      return;
    }

    setLoading(true);
    try {
      const updates: { email?: string; password?: string } = {};
      if (email.trim()) updates.email = email.trim();
      if (password.trim()) updates.password = password.trim();

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      showToast("Credenciais atualizadas com sucesso!", "success");
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro ao atualizar: ${err.message}`, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-6 border-b border-slate-800">
      <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">
        Credenciais de Acesso
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Novo E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="Alterar e-mail..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-sans transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Nova Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="Alterar senha..."
              minLength={6}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-sans transition-colors"
            />
          </div>
        </div>
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={loading || (!email.trim() && !password.trim())}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 border border-slate-700 shadow-sm"
          >
            {loading ? "Atualizando..." : "Atualizar Credenciais"}
          </button>
        </div>
      </form>
    </div>
  );
};

// ----------------------------------------------------------------------
// Subcomponente: Formulário de Configurações (Uncontrolled Components)
// ----------------------------------------------------------------------
// 4. Consumo limpo: O 'initialData' agora está atrelado ao banco de dados nativamente.
// Se o Backend alterar 'maxDailyReviews' para um tipo Float amanhã, este componente 
// apontará o erro instantaneamente, sem interfaces manuais "mentindo" no meio do caminho.
const SettingsForm: React.FC<{ initialData: UserSettings; onClose: () => void }> = ({
  initialData,
  onClose,
}) => {
  const { showToast } = useToast();
  const [updateSettings, { loading: mutationLoading }] = useMutation(UPDATE_MY_SETTINGS);

  // Determina o fuso do dispositivo atual para comparação
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Define o fuso que será exibido (priorizando o que já está salvo no banco)
  const savedTimezone = initialData.timezone || browserTimezone;

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mutationLoading) return;

    const formData = new FormData(e.currentTarget);
    
    // Extração 100% Type-Safe com construtores nativos
    const dailyNewCardLimit = parseInt(String(formData.get("dailyNewCardLimit") ?? "0"), 10);
    const maxDailyReviews = parseInt(String(formData.get("maxDailyReviews") ?? "0"), 10);
    const dailyRolloverTime = String(formData.get("dailyRolloverTime") ?? "");
    const timezone = String(formData.get("timezone") ?? "");

    // Padrão Bouncer invocado com Função Pura
    const validationError = validateSettingsInput(
      dailyNewCardLimit,
      maxDailyReviews,
      dailyRolloverTime,
      timezone
    );

    if (validationError) {
      showToast(validationError, "error");
      return;
    }

    try {
      await updateSettings({
        variables: {
          data: {
            dailyNewCardLimit,
            maxDailyReviews,
            timezone,
            dailyRolloverTime,
          },
        },
      });
      showToast("Configurações atualizadas!", "success");
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Falha ao salvar: ${err.message}`, "error");
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
          name="dailyNewCardLimit"
          defaultValue={initialData.dailyNewCardLimit}
          min="0"
          max="500"
          disabled={mutationLoading}
          required
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-sans"
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
          disabled={mutationLoading}
          required
          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-sans"
        />
      </div>

      {/* Agrupamento temporal com Flexbox: Alinhamento limpo e responsivo */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-slate-800/50 pt-4 mt-2">
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Fuso Horário (Timezone)
          </label>
          <select
            name="timezone"
            defaultValue={savedTimezone}
            disabled={mutationLoading}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-sans appearance-none cursor-pointer"
          >
            <option value={savedTimezone}>{savedTimezone}</option>
            {/* Opcional: Oferece a atualização do fuso apenas se divergir daquele armazenado no banco */}
            {browserTimezone !== savedTimezone && (
              <option value={browserTimezone}>{browserTimezone} (Atual)</option>
            )}
          </select>
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Horário de Virada
          </label>
          <input
            type="time"
            name="dailyRolloverTime"
            defaultValue={initialData.dailyRolloverTime || "04:00"}
            disabled={mutationLoading}
            required
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-sans"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onClose}
          disabled={mutationLoading}
          className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 cursor-pointer disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={mutationLoading}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
        >
          {mutationLoading ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </form>
  );
};

// ----------------------------------------------------------------------
// Subcomponente: Zona de Perigo LGPD (Isolamento de Domínio)
// ----------------------------------------------------------------------
const DangerZone: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { showToast } = useToast();
  const { logout } = useAuth();
  const client = useApolloClient();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [anonymizeMe, { loading: anonymizing }] = useMutation(ANONYMIZE_ME);

  const handleDeleteAccount = async () => {
    try {
      await anonymizeMe();
      showToast("Direito ao esquecimento exercido. Seus dados foram submetidos à anonimização irreversível.", "success");
      onClose();

      await client.clearStore();
      await supabase.auth.signOut({ scope: "local" });

      try {
        await logout();
      } catch {
        window.location.href = "/";
      }

    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro na deleção de conta: ${err.message}`, "error");
      }
    }
  };

  return (
    <div className="flex flex-col gap-3 pt-4 border-t border-rose-900/30">
      <h3 className="text-xs font-bold text-rose-500 uppercase tracking-wider">
        Zona de Perigo (LGPD)
      </h3>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-rose-950/20 border border-rose-900/50 rounded-xl">
        <p className="text-[10px] text-rose-200/70 leading-relaxed flex-1">
          Ao excluir sua conta, você exerce o <b>direito ao esquecimento</b>. Seus dados serão submetidos à anonimização irreversível.
        </p>
        {!showConfirmDelete ? (
          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            disabled={anonymizing}
            className="shrink-0 px-4 py-2 bg-rose-950 text-rose-400 font-bold text-[11px] rounded-lg border border-rose-900/50 hover:bg-rose-900 hover:text-rose-100 transition-all cursor-pointer disabled:opacity-50"
          >
            Excluir Conta
          </button>
        ) : (
          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-2 animate-fadeIn">
            <button
              type="button"
              disabled={anonymizing}
              onClick={() => setShowConfirmDelete(false)}
              className="w-full sm:w-auto px-3 py-2 bg-slate-800 text-slate-300 font-bold text-[11px] rounded-lg border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={anonymizing}
              onClick={handleDeleteAccount}
              className="w-full sm:w-auto px-3 py-2 bg-rose-600 text-white font-bold text-[11px] rounded-lg hover:bg-rose-700 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
            >
              {anonymizing ? "Processando..." : "Confirmar Exclusão"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};