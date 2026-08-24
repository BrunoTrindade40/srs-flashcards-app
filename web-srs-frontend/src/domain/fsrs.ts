/**
 * Objeto constante refletindo o MER acadêmico para o estado FSRS.
 * Substitui o uso do TypeScript 'enum' para garantir conformidade
 * com 'erasableSyntaxOnly' e compiladores puramente sintáticos.
 */
export const FsrsState = {
  NEW: 0,
  LEARNING: 1,
  REVIEW: 2,
  RELEARNING: 3,
} as const;

/**
 * Extração estática do tipo baseada nos valores numéricos do objeto.
 * O TypeScript inferirá isso de forma "apagável" (erasable) como: 0 | 1 | 2 | 3
 */
export type FsrsState = (typeof FsrsState)[keyof typeof FsrsState];

/**
 * Type Guard puro para validação de fronteira (Network Boundary).
 * Garante que o número bruto retornado pelo Apollo Client seja um estado FSRS válido.
 */
export function isValidFsrsState(state: number | null | undefined): state is FsrsState {
  // 1. Padrão Bouncer: Rejeita imediatamente nulos ou indefinidos
  if (state === null || state === undefined) {
    return false;
  }

  // 2. Transforma os valores do objeto constante em um array nativo
  // A tipagem 'number[]' é declarada para evitar inferências frouxas
  const validValues: number[] = Object.values(FsrsState);
  
  return validValues.includes(state);
}