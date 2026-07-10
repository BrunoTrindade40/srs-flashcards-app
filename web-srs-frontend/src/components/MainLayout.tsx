import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";

export const MainLayout: React.FC = () => {
  return (
    // Alterado para bg-gray-50 para uma integração perfeita com os cards brancos
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Header />

      <main className="flex-1 w-full">
        <Outlet />
      </main>
    </div>
  );
};
