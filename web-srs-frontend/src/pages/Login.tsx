import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { AuthForm } from "../components/AuthForm";
import type { AuthMode } from "../domain/auth";
// 1. Importação obrigatória da Fonte Única da Verdade (SSOT)
import { validateCredentialsInput } from "../domain/validators";

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
    setPassword(""); 
  };

  const handleSignIn = async (): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return true; 
  };

  const handleSignUp = async (): Promise<boolean> => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    setSuccessMsg("Conta criada com sucesso! Verifique seu e-mail para confirmação.");
    return false; 
  };

  const handleForgotPassword = async (): Promise<boolean> => {
    // 2. Limpeza de Silo de Conhecimento local. A garantia da string segura
    // agora provém exclusivamente da função de validação de domínio superior.
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/dashboard`,
    });
    
    if (error) throw error;
    setSuccessMsg("Instruções de recuperação enviadas para o seu e-mail.");
    return false; 
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 3. Padrão Bouncer: Previne submissões duplicadas na UI
    if (loading) return; 

    resetFeedback();

    // 4. Delegação Estrita de Domínio (Early-Fail)
    // Se o modo for "FORGOT_PASSWORD", omitimos a senha da verificação
    // para focar estritamente na validação do Regex do E-mail.
    const validationError = validateCredentialsInput(
      email, 
      mode === "FORGOT_PASSWORD" ? "" : password
    );

    // Bloqueia a execução síncrona sem disparar requisições inúteis ao Supabase
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setLoading(true);
    
    try {
      let shouldNavigate = false;

      if (mode === "LOGIN") {
        shouldNavigate = await handleSignIn();
      } else if (mode === "SIGNUP") {
        shouldNavigate = await handleSignUp();
      } else if (mode === "FORGOT_PASSWORD") {
        shouldNavigate = await handleForgotPassword();
      }

      if (shouldNavigate) {
        navigate("/dashboard");
      } else {
        setLoading(false);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
      setLoading(false);
    }
  };

  return (
    <AuthForm
      mode={mode}
      email={email}
      password={password}
      loading={loading}
      errorMsg={errorMsg}
      successMsg={successMsg}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      onSwitchMode={switchMode}
    />
  );
}