// ----------------------------------------------------------------------
// Subcomponente: Atualização de Credenciais (RF16)
// ----------------------------------------------------------------------

import { useState } from "react";
import { useToast } from "../../hooks/useToast";
import { validateCredentialsInput } from "../../domain/validators";
import { supabase } from "../../lib/supabaseClient";

export const CredentialsForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    
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
      onClose(); // O componente encerra seu ciclo de vida.
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(`Erro ao atualizar: ${err.message}`, "error");
      }
      // Reativa a UI isoladamente para o contexto de erro
      setLoading(false);
    }
    // Bloco finally removido.
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
