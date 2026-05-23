import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isRegistering, setIsRegistering] = useState(false); // Controle de fluxo: Login vs Registro
  const navigate = useNavigate();

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (isRegistering) {
      // Fluxo de Registro (Sign Up)
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMsg(`Erro ao registrar: ${error.message}`);
        return;
      }

      // Opcional: Avisar o usuário se a confirmação de e-mail ainda estiver ativa
      alert("Conta criada com sucesso! Autenticando...");
    }

    // Fluxo de Autenticação (Sign In)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setErrorMsg(signInError.message);
      return;
    }

    navigate("/");
  };

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#f4f4f5",
  };

  const formStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    padding: "2.5rem",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "400px",
  };

  return (
    <div style={containerStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h2 style={{ textAlign: "center", margin: 0, color: "#09090b" }}>
          {isRegistering ? "Criar Nova Conta" : "Autenticação SRS"}
        </h2>

        {errorMsg && (
          <span
            style={{
              color: "#991b1b",
              fontSize: "0.9rem",
              textAlign: "center",
            }}
          >
            {errorMsg}
          </span>
        )}

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label
            htmlFor="email"
            style={{ fontWeight: "bold", fontSize: "0.9rem" }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: "0.75rem",
              border: "1px solid #d4d4d8",
              borderRadius: "4px",
            }}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label
            htmlFor="password"
            style={{ fontWeight: "bold", fontSize: "0.9rem" }}
          >
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6} // O Supabase exige mínimo de 6 caracteres por padrão
            style={{
              padding: "0.75rem",
              border: "1px solid #d4d4d8",
              borderRadius: "4px",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            marginTop: "0.5rem",
          }}
        >
          <button
            type="submit"
            style={{
              padding: "0.75rem",
              backgroundColor: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {isRegistering ? "Confirmar Registro" : "Entrar"}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorMsg("");
            }}
            style={{
              padding: "0.5rem",
              backgroundColor: "transparent",
              color: "#2563eb",
              border: "none",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            {isRegistering
              ? "Já possui uma conta? Faça login"
              : "Não possui conta? Registre-se"}
          </button>
        </div>
      </form>
    </div>
  );
};
