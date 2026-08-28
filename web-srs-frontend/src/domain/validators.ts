// src/domain/validators.ts
// Centraliza as regras de negócio de formulários, permitindo testabilidade sem onerar o React.

export const validateDeckInput = (title: string, description: string): string | null => {
  const safeTitle = title.trim();
  if (!safeTitle) return "O Título do Baralho é obrigatório.";
  if (safeTitle.length > 100) return "O título excedeu o limite de segurança (100 caracteres).";
  if (description.trim().length > 500) return "A descrição excedeu o limite de segurança (500 caracteres).";
  return null;
};

export const validateFlashcardInput = (front: string, back: string, source: string): string | null => {
  const safeFront = front.trim();
  const safeBack = back.trim();
  const safeSource = source.trim();
  if (!safeFront || safeFront.length < 2) return "A Frente do cartão exige no mínimo 2 caracteres.";
  if (safeFront.length > 2000) return "A Frente excedeu o limite de segurança (2000 caracteres).";
  if (!safeBack || safeBack.length < 2) return "O Verso do cartão exige no mínimo 2 caracteres.";
  if (safeBack.length > 3000) return "O Verso excedeu o limite de segurança (3000 caracteres).";
  if (safeSource && safeSource.length > 255) return "O Contexto de Origem não pode exceder 255 caracteres.";
  return null;
};

// SSOT: Regras de higienização de credenciais centralizadas e isoladas da UI
export const validateCredentialsInput = (email: string, password: string): string | null => {
  const safeEmail = email.trim();
  const safePassword = password.trim();
  
  if (!safeEmail && !safePassword) {
    return "Preencha o e-mail ou a nova senha para atualizar.";
  }
  if (safePassword && safePassword.length < 6) {
    return "A nova senha deve ter no mínimo 6 caracteres.";
  }
  if (safeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) {
    return "Forneça um endereço de e-mail válido.";
  }
  
  return null;
};

// SSOT: Regras de contenção matemática para metas cognitivas e limites de estudo
export const validateSettingsInput = (
  dailyNewCardLimit: number,
  maxDailyReviews: number,
  dailyRolloverTime: string,
  timezone: string
): string | null => {
  if (isNaN(dailyNewCardLimit) || dailyNewCardLimit < 0 || dailyNewCardLimit > 500) {
    return "O limite de novos cartões deve estar entre 0 e 500.";
  }
  if (isNaN(maxDailyReviews) || maxDailyReviews < 10 || maxDailyReviews > 2000) {
    return "O limite máximo de revisões deve estar entre 10 e 2000.";
  }
  if (!dailyRolloverTime.trim()) {
    return "O horário de virada diária é obrigatório.";
  }
  if (!timezone.trim()) {
    return "O fuso horário é obrigatório.";
  }
  return null;
};