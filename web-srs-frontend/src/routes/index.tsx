import { Route, Routes } from "react-router-dom";
import { CreateDeck } from "../pages/CreateDeck";
import { Dashboard } from "../pages/Dashboard";
import { DeckDetails } from "../pages/DeckDetails";
import { Login } from "../pages/Login";
import { StudySession } from "../pages/StudySession";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Rota renderizando o componente Dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />

      <Route path="/create-deck" element={<CreateDeck />} />

      {/* CORREÇÃO: O parâmetro dinâmico foi renomeado de :id para :deckId */}
      <Route path="/deck/:deckId" element={<DeckDetails />} />

      <Route path="/study/:deckId" element={<StudySession />} />
    </Routes>
  );
}
