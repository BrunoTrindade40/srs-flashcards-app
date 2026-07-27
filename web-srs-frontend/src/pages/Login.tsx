import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Responsabilidade Única: Autenticação de usuário existente
  const handleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate("/dashboard");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("Erro ao realizar login. Verifique suas credenciais.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Responsabilidade Única: Registro de novo usuário
  const handleSignUp = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      setSuccessMsg(
        "Conta criada com sucesso! Verifique seu e-mail para confirmação.",
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("Erro ao cadastrar usuário.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Orquestrador de submissão (Tipagem do React 19)
  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLogin) {
      handleSignIn();
    } else {
      handleSignUp();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 text-2xl mx-auto mb-4">
            ⚡
          </div>
          <h1 className="text-2xl font-bold text-slate-100">
            {isLogin ? "Bem-vindo de volta" : "Criar nova conta"}
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            {isLogin
              ? "Acesse seus Flashcards e continue sua ofensiva."
              : "Junte-se à plataforma e otimize seu aprendizado."}
          </p>
        </div>

        {/* Feedback de UI Assíncrono */}
        {errorMsg && (
          <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm text-center">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              className="text-sm font-medium text-slate-300"
              htmlFor="email"
            >
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

          <div className="flex flex-col gap-1.5">
            <label
              className="text-sm font-medium text-slate-300"
              htmlFor="password"
            >
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

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processando..." : isLogin ? "Entrar" : "Cadastrar"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="text-sm text-amber-500 hover:text-amber-400 font-medium transition-colors"
          >
            {isLogin
              ? "Não tem uma conta? Cadastre-se"
              : "Já tem uma conta? Faça login"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
