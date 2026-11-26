import { useCallback, useEffect, useMemo, useState } from 'react';

import { MOMENTUM } from '../domain/review/thresholds';
import { useMoveSounds } from './useGameSounds';

// How long each position shows: the replay about MOMENTUM.replayMs in all,
// but never faster or slower a move than its limits.
export function momentumStepMs(positions: number): number {
  return Math.min(
    MOMENTUM.maxStepMs,
    Math.max(MOMENTUM.minStepMs, MOMENTUM.replayMs / Math.max(1, positions)),
  );
}

// A game's momentum played back: the position the rope's at, a step at a
// time from the start to the end, each turning point's move sounded as the
// rope passes it and held a moment longer; stopped at will.
export function useMomentumReplay(
  moves: { san: string }[],
  turns: number[],
): {
  at: number | null;
  isPlaying: boolean;
  play: () => void;
  stop: () => void;
} {
  // The position the rope's at - 0 the start, then after each move - or
  // null when it isn't playing.
  const [at, setAt] = useState<number | null>(null);
  const positions = moves.length + 1;
  const stepMs = momentumStepMs(positions);

  useEffect(() => {
    if (at === null) return;
    const isTurn = at > 0 && turns.includes(at - 1);
    const timer = setTimeout(
      () =>
        setAt((current) =>
          current === null || current >= positions - 1 ? null : current + 1,
        ),
      stepMs + (isTurn ? MOMENTUM.turnHoldMs : 0),
    );
    return () => clearTimeout(timer);
  }, [at, positions, stepMs, turns]);

  // The move just passed, sounded when it turned the game.
  const turning = useMemo(() => {
    if (at === null || at === 0) return null;
    const index = at - 1;
    return turns.includes(index) ? { san: moves[index].san, index } : null;
  }, [at, turns, moves]);
  useMoveSounds(turning);

  const play = useCallback(() => setAt(0), []);
  const stop = useCallback(() => setAt(null), []);
  return { at, isPlaying: at !== null, play, stop };
}
