import { Navigate, Route, Routes } from "react-router-dom";
import { CreateDeck } from "../pages/CreateDeck";
import { Dashboard } from "../pages/Dashboard";
import { DeckDetails } from "../pages/DeckDetails";
import { Login } from "../pages/Login";
import { StudySession } from "../pages/StudySession";
import { MainLayout } from "../components/MainLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { RequireDeckParam } from "../components/RequireDeckParam";
import { RootRedirect } from "../components/RootRedirect";

export function AppRoutes() {
  return (
    <Routes>
      {/* 1. Tratamento da URL raiz */}
      <Route path="/" element={<RootRedirect />} />

      {/* 2. Rota Pública de Autenticação */}
      <Route path="/login" element={<Login />} />

      {/* 3. Bloco de Rotas Protegidas por Autenticação */}
      <Route element={<ProtectedRoute />}>
        {/* Sub-bloco com o Header de Navegação Global (Tema Claro) */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-deck" element={<CreateDeck />} />

          {/* Rota com Validação Declarativa de Parâmetro */}
          <Route element={<RequireDeckParam />}>
            <Route path="/deck/:deckId" element={<DeckDetails />} />
          </Route>
        </Route>

        {/* Rota de Foco Profundo (Sem Header) com Validação de Parâmetro */}
        <Route element={<RequireDeckParam />}>
          <Route path="/study/:deckId" element={<StudySession />} />
        </Route>
      </Route>

      {/* 4. Fallback de Segurança para Rotas Inexistentes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}