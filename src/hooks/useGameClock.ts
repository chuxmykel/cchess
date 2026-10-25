import { useEffect, useState } from 'react';
import { Color } from 'chess.js';

export type GameClockResult = {
  whiteMs: number;
  blackMs: number;
};

const TICK_MS = 100;

// The last clock reading received from the server - {whiteTimeMs,
// blackTimeMs, turn} as last received via props - that the local tick count
// below counts forward from, until the next update from the server replaces
// it.
type ServerClock = {
  whiteTimeMs: number;
  blackTimeMs: number;
  turn: Color;
};

// Ticks the two clocks locally between authoritative server updates, by
// counting elapsed ticks rather than reading the wall clock - render must
// stay pure (no Date.now()).
// Every time whiteTimeMs/blackTimeMs/turn change (a move landed, or the game
// ended), the server clock resets and the elapsed counter restarts from
// zero - done directly during render (React's "adjusting state when a prop
// changes" pattern) so the reset is visible in the same render it's
// triggered by.
export function useGameClock(
  whiteTimeMs: number,
  blackTimeMs: number,
  turn: Color,
  isActive: boolean,
): GameClockResult {
  const [serverClock, setServerClock] = useState<ServerClock>({
    whiteTimeMs,
    blackTimeMs,
    turn,
  });
  const [elapsedMs, setElapsedMs] = useState(0);

  if (
    serverClock.whiteTimeMs !== whiteTimeMs ||
    serverClock.blackTimeMs !== blackTimeMs ||
    serverClock.turn !== turn
  ) {
    setServerClock({ whiteTimeMs, blackTimeMs, turn });
    setElapsedMs(0);
  }

  useEffect(() => {
    if (!isActive) {
      return;
    }
    const interval = setInterval(
      () => setElapsedMs((ms) => ms + TICK_MS),
      TICK_MS,
    );
    return () => clearInterval(interval);
  }, [isActive]);

  return {
    whiteMs:
      serverClock.turn === 'w'
        ? Math.max(0, serverClock.whiteTimeMs - elapsedMs)
        : serverClock.whiteTimeMs,
    blackMs:
      serverClock.turn === 'b'
        ? Math.max(0, serverClock.blackTimeMs - elapsedMs)
        : serverClock.blackTimeMs,
  };
}
