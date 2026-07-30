import { useCallback, useState } from "react";

export function useDailyReviewTracker(userId: string | null = null) {
  // Inicialização Preguiçosa para a contagem total de revisões
  const [todayReviewCount, setTodayReviewCount] = useState<number>(() => {
    if (!userId) return 0;
    const today = new Date().toDateString();
    const key = `srs_tracker_${userId}_${today}`;
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) : 0;
  });

  // Inicialização Preguiçosa para a contagem de cartões novos estudados hoje
  const [todayNewCardCount, setTodayNewCardCount] = useState<number>(() => {
    if (!userId) return 0;
    const today = new Date().toDateString();
    const key = `srs_new_tracker_${userId}_${today}`;
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) : 0;
  });

  const [prevUserId, setPrevUserId] = useState<string | null>(userId);

  // Render Phase State Update para quando o userId carregar
  if (userId !== prevUserId) {
    setPrevUserId(userId);

    if (userId) {
      const today = new Date().toDateString();
      const keyReview = `srs_tracker_${userId}_${today}`;
      const storedReview = localStorage.getItem(keyReview);
      setTodayReviewCount(storedReview ? parseInt(storedReview, 10) : 0);

      const keyNew = `srs_new_tracker_${userId}_${today}`;
      const storedNew = localStorage.getItem(keyNew);
      setTodayNewCardCount(storedNew ? parseInt(storedNew, 10) : 0);
    } else {
      setTodayReviewCount(0);
      setTodayNewCardCount(0);
    }
  }

  // Incrementa as revisões e, opcionalmente, a contagem de cartões novos
  const incrementReviewCount = useCallback(
    (isNewCard = false) => {
      if (!userId) return;

      const today = new Date().toDateString();
      const keyReview = `srs_tracker_${userId}_${today}`;

      setTodayReviewCount((currentCount) => {
        const newCount = currentCount + 1;
        localStorage.setItem(keyReview, newCount.toString());
        return newCount;
      });

      if (isNewCard) {
        const keyNew = `srs_new_tracker_${userId}_${today}`;
        setTodayNewCardCount((currentCount) => {
          const newCount = currentCount + 1;
          localStorage.setItem(keyNew, newCount.toString());
          return newCount;
        });
      }
    },
    [userId],
  );

  return { todayReviewCount, todayNewCardCount, incrementReviewCount };
}