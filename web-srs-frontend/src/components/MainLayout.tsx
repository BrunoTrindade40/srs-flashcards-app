import { Outlet } from "react-router-dom";
import { Header } from "./Header";

// UI02: Ancoragem estática clara preservada internamente no <Header />, 
// enquanto o invólucro da aplicação adota o tema escuro exigido.
export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}