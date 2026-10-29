import { GameClockResult } from '../hooks/useGameClock';

// The clocks as the server last gave them, never ticking: on real timers,
// a tick landing between a test's steps updates the screen outside act().
export function useGameClock(
  whiteTimeMs: number,
  blackTimeMs: number,
): GameClockResult {
  return { whiteMs: whiteTimeMs, blackMs: blackTimeMs };
}
