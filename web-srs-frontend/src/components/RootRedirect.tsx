import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function RootRedirect() {
  const { user, loading } = useAuth();

  // 1. Estado de Espera: Idêntico ao ProtectedRoute para coerência visual
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div
          className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"
          aria-label="Direcionando..."
        />
      </div>
    );
  }

  // 2. Tráfego Direcionado de forma Declarativa
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}
