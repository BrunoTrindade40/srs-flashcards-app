import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { ANONYMIZE_ME } from "../../lib/graphql/settings";

interface DangerZoneProps {
  onClose: () => void;
}

export const DangerZone = ({ onClose }: DangerZoneProps) => {
  const { showToast } = useToast();
  const { logout } = useAuth();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [anonymizeMe, { loading: anonymizing }] = useMutation(ANONYMIZE_ME);

  const handleDeleteAccount = async () => {
    try {
      await anonymizeMe();
      showToast(
        "Direito ao esquecimento exercido. Seus dados foram anonimizados irreversivelmente.",
        "success"
      );

      try {
        await logout();
        onClose();
      } catch {
        // Fail-Safe em caso de erro do ciclo de purga
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
          Ao excluir sua conta, você exerce o <b>direito ao esquecimento</b>. Seus dados sofrerão anonimização irreversível.
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