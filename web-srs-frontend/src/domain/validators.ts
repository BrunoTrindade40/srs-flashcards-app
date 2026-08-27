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