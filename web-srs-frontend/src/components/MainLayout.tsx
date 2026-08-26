import { Outlet } from "react-router-dom";
import { Header } from "./Header";

// O Layout principal não deve forçar o Dark Mode Globalmente para não entrar
// em conflito com o Cabeçalho que, por exigência (UI02), precisa de fundo branco.
export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;