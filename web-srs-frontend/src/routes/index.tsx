import { Route, Routes } from "react-router-dom";
import { CreateDeck } from "../pages/CreateDeck";
import Dashboard from "../pages/Dashboard";
import { DeckDetails } from "../pages/DeckDetails";
import { Login } from "../pages/Login";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Rota renderizando o novo componente Dashboard */}
      <Route path="/" element={<Dashboard />} />

      <Route path="/deck/new" element={<CreateDeck />} />

      {/* Rota dinâmica recebendo o UUID do Deck */}
      <Route path="/deck/:id" element={<DeckDetails />} />
    </Routes>
  );
}
