import { useEffect, useState } from 'react';

const TICK_MS = 250;

function secondsUntil(deadline: string): number {
  return Math.max(0, Math.ceil((Date.parse(deadline) - Date.now()) / 1000));
}

// Whole seconds left before the first-move deadline, or null without one.
export function useFirstMoveCountdown(deadline: string | null): number | null {
  const [countdown, setCountdown] = useState<{
    deadline: string;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!deadline) {
      return;
    }
    const tick = () =>
      setCountdown({ deadline, seconds: secondsUntil(deadline) });
    const firstTick = setTimeout(tick, 0);
    const interval = setInterval(tick, TICK_MS);
    return () => {
      clearTimeout(firstTick);
      clearInterval(interval);
    };
  }, [deadline]);

  return deadline && countdown?.deadline === deadline
    ? countdown.seconds
    : null;
}
