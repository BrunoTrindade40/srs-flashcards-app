import React from "react";
// Importamos o tipo da fonte da verdade no domínio
import type { AuthMode } from "../domain/auth";

interface AuthFormProps {
  mode: AuthMode;
  email: string;
  password: string;
  loading: boolean;
  errorMsg: string | null;
  successMsg: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  onSwitchMode: (mode: AuthMode) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  email,
  password,
  loading,
  errorMsg,
  successMsg,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onSwitchMode,
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 text-2xl mx-auto mb-4">
            {/* Ícone de Cadeado Omitido */}
          </div>
          <h1 className="text-2xl font-bold text-slate-100">
            {mode === "LOGIN" && "Bem-vindo de volta"}
            {mode === "SIGNUP" && "Criar nova conta"}
            {mode === "FORGOT_PASSWORD" && "Recuperar Senha"}
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            {mode === "LOGIN" && "Acesse seus Flashcards e continue sua ofensiva."}
            {mode === "SIGNUP" && "Junte-se à plataforma e otimize seu aprendizado."}
            {mode === "FORGOT_PASSWORD" && "Enviaremos um link seguro para o seu e-mail."}
          </p>
        </div>

        {errorMsg !== null && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {successMsg !== null && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          {mode !== "FORGOT_PASSWORD" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processando..." : mode === "LOGIN" ? "Entrar" : mode === "SIGNUP" ? "Cadastrar" : "Enviar Link"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 text-center">
          {mode !== "LOGIN" && (
            <button
              type="button"
              onClick={() => onSwitchMode("LOGIN")}
              className="text-sm text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              Já tem uma conta? Faça login
            </button>
          )}
          {mode !== "SIGNUP" && (
            <button
              type="button"
              onClick={() => onSwitchMode("SIGNUP")}
              className="text-sm text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              Não tem uma conta? Cadastre-se
            </button>
          )}
          {mode === "LOGIN" && (
            <button
              type="button"
              onClick={() => onSwitchMode("FORGOT_PASSWORD")}
              className="text-xs text-amber-500 hover:text-amber-400 transition-colors font-medium cursor-pointer"
            >
              Esqueci minha senha
            </button>
          )}
        </div>
      </div>
    </div>
  );
};