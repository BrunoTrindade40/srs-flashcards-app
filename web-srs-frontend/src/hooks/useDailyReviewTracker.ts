import { useCallback, useState } from "react";

// 🔵 FIM DO UNDEFINED: O parâmetro agora exige explicitamente uma string ou null.
export function useDailyReviewTracker(userId: string | null = null) {
  // Inicialização Preguiçosa (Lazy Initial State)
  const [todayReviewCount, setTodayReviewCount] = useState<number>(() => {
    if (!userId) return 0;
    const today = new Date().toDateString();
    const key = `srs_tracker_${userId}_${today}`;
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) : 0;
  });

  // 🟢 REGRA APLICADA: Uso do 'null' como ausência semântica e intencional de valor
  const [prevUserId, setPrevUserId] = useState<string | null>(userId);

  // Atualização de Estado na Fase de Renderização (Render Phase Update)
  if (userId !== prevUserId) {
    setPrevUserId(userId);

    if (userId) {
      const today = new Date().toDateString();
      const key = `srs_tracker_${userId}_${today}`;
      const stored = localStorage.getItem(key);
      setTodayReviewCount(stored ? parseInt(stored, 10) : 0);
    } else {
      setTodayReviewCount(0);
    }
  }

  const incrementReviewCount = useCallback(() => {
    if (!userId) return;

    const today = new Date().toDateString();
    const key = `srs_tracker_${userId}_${today}`;

    setTodayReviewCount((currentCount) => {
      const newCount = currentCount + 1;
      localStorage.setItem(key, newCount.toString());
      return newCount;
    });
  }, [userId]);

  return { todayReviewCount, incrementReviewCount };
}