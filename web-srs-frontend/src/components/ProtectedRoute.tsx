import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Removida a interface ProtectedRouteProps.
// Componentes de Layout no React Router v6 não precisam receber 'children'.

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. Estado de Espera: Impede a renderização prematura
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div
          className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"
          aria-label="Validando credenciais..."
        />
      </div>
    );
  }

  // 2. Barreira de Segurança: Expulsa se não houver usuário logado
  if (!user) {
    // Passamos o state 'from' para que a tela de login saiba de onde viemos
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Sucesso: Renderiza as rotas aninhadas através do Outlet
  return <Outlet />;
}
