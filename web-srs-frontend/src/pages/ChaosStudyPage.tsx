import React from "react";
import { useNavigate } from "react-router-dom";

export const ChaosStudyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    // 🟢 REGRA APLICADA: 100% Flexbox, Tema Escuro (bg-slate-950), ocupando toda a viewport
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center max-w-lg text-center gap-6 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        <span className="text-6xl drop-shadow-2xl">🌪️</span>

        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-100">Modo Caos</h1>
          <span className="bg-violet-900/50 text-violet-300 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider border border-violet-800 font-bold">
            Desbloqueio na Fase 2
          </span>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed">
          O Modo Caos (Simulado Intercalado) é uma funcionalidade avançada de
          roteamento cognitivo que será implementada na próxima fase da
          plataforma. Continue a fortalecer a sua base de conhecimento no modo
          de estudo padrão!
        </p>

        <button
          onClick={() => navigate("/dashboard")}
          className="mt-4 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all cursor-pointer border border-slate-700 shadow-lg flex items-center gap-2"
        >
          <span>← Voltar ao Painel</span>
        </button>
      </div>
    </div>
  );
};
