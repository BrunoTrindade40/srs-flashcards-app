import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "../pages/Dashboard";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<div>Tela de Login (Em breve)</div>} />

        {/* Rota renderizando o novo componente Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        <Route
          path="/deck/:id"
          element={<div>Detalhes do Deck: Flashcards</div>}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
