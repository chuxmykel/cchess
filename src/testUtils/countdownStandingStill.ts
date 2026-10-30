// The seconds left as of each render, never ticking: on real timers, a
// tick landing between a test's steps updates the screen outside act().
export function useFirstMoveCountdown(deadline: string | null): number | null {
  if (!deadline) {
    return null;
  }
  return Math.max(0, Math.ceil((Date.parse(deadline) - Date.now()) / 1000));
}
