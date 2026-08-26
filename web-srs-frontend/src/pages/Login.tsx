import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

// Padrão Máquina de Estados para expansão segura de fluxos
type AuthMode = "LOGIN" | "SIGNUP" | "FORGOT_PASSWORD";

export function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("LOGIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetFeedback = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetFeedback();
    setPassword(""); // Limpeza de segurança na troca de contexto
  };

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) setErrorMsg(err.message);
    }
  };

  const handleSignUp = async () => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setSuccessMsg("Conta criada com sucesso! Verifique seu e-mail para confirmação.");
    } catch (err: unknown) {
      if (err instanceof Error) setErrorMsg(err.message);
    }
  };

  // RF16: Implementação do fluxo de Solicitação de Redefinição
  const handleForgotPassword = async () => {
    const safeEmail = email.trim();
    if (!safeEmail) {
      setErrorMsg("Por favor, insira seu e-mail para recuperação.");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(safeEmail, {
        redirectTo: `${window.location.origin}/dashboard`,
      });
      if (error) throw error;
      setSuccessMsg("Instruções de recuperação enviadas para o seu e-mail.");
    } catch (err: unknown) {
      if (err instanceof Error) setErrorMsg(`Erro: ${err.message}`);
    }
  };

  // Tipagem estrita de submissão do React 19
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    resetFeedback();
    setLoading(true);

    // Roteador de execução baseado no estado estrito
    if (mode === "LOGIN") await handleSignIn();
    if (mode === "SIGNUP") await handleSignUp();
    if (mode === "FORGOT_PASSWORD") await handleForgotPassword();

    setLoading(false);
  };

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

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          {/* Oculta o campo de senha durante a recuperação */}
          {mode !== "FORGOT_PASSWORD" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              onClick={() => switchMode("LOGIN")}
              className="text-sm text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              Já tem uma conta? Faça login
            </button>
          )}
          {mode !== "SIGNUP" && (
            <button
              type="button"
              onClick={() => switchMode("SIGNUP")}
              className="text-sm text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              Não tem uma conta? Cadastre-se
            </button>
          )}
          {mode === "LOGIN" && (
            <button
              type="button"
              onClick={() => switchMode("FORGOT_PASSWORD")}
              className="text-xs text-amber-500 hover:text-amber-400 transition-colors font-medium cursor-pointer"
            >
              Esqueci minha senha
            </button>
          )}
        </div>
      </div>
    </div>
  );
}