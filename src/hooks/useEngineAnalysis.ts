import { useEffect, useMemo, useRef, useState } from 'react';

import {
  EngineScore,
  NumberedMove,
  formatScore,
  numberMoves,
  pvToSan,
  SanCache,
} from '../domain/evalScore';
import { AnalysisEngine, EngineUpdate, SearchLimit } from '../engine/types';

export type EngineLineView = {
  score: EngineScore;
  formatted: string;
  // The line's moves, as SAN, and numbered.
  sans: string[];
  moves: NumberedMove[];
  // Its moves, as UCI - the first is the move it suggests.
  pv: string[];
};

export type EngineAnalysis = {
  // Off: no engine or not wanted. Thinking: lines are coming in; done: the
  // search reached its limit.
  status: 'off' | 'thinking' | 'done';
  depth: number;
  lines: EngineLineView[];
  // The lines are the last position's, kept to show until this one's come -
  // not to be drawn or played on this one.
  stale: boolean;
};

export type EngineAnalysisOptions = {
  enabled: boolean;
  multiPv: number;
  limit: SearchLimit;
};

// Wait this long on a position before analysing it, so stepping quickly
// through moves doesn't start a search on each.
export const SETTLE_MS = 150;
// Show the search's progress at most this often.
export const UPDATE_INTERVAL_MS = 250;
// A line's moves shown: more than fit across the screen, which cuts it off -
// not all of a deep search's, each of which chess.js has to play out.
const SAN_PLIES = 20;
const SAN_CACHE_SIZE = 5000;

const OFF: EngineAnalysis = {
  status: 'off',
  depth: 0,
  lines: [],
  stale: false,
};

// What an engine makes of a position, as it thinks: its best lines, best
// first, and how deep it's looked. A new position stops the search on the
// last one.
export function useEngineAnalysis(
  engine: AnalysisEngine | null,
  fen: string | null,
  { enabled, multiPv, limit }: EngineAnalysisOptions,
): EngineAnalysis {
  const [update, setUpdate] = useState<EngineUpdate | null>(null);
  const latest = useRef<EngineUpdate | null>(null);

  // The limit by its parts, so a new object with the same limit isn't a
  // new search.
  const { depth, movetimeMs, infinite } = limit;

  useEffect(() => {
    if (!engine || !fen || !enabled) return;
    let stop: (() => void) | null = null;
    let flush: ReturnType<typeof setTimeout> | null = null;
    const start = setTimeout(() => {
      const request = { fen, multiPv, limit: { depth, movetimeMs, infinite } };
      stop = engine.analyse(request, (next) => {
        latest.current = next;
        if (next.done) {
          if (flush) clearTimeout(flush);
          flush = null;
          setUpdate(next);
        } else if (!flush) {
          flush = setTimeout(() => {
            flush = null;
            setUpdate(latest.current);
          }, UPDATE_INTERVAL_MS);
        }
      });
    }, SETTLE_MS);
    return () => {
      clearTimeout(start);
      if (flush) clearTimeout(flush);
      stop?.();
    };
  }, [engine, fen, enabled, multiPv, depth, movetimeMs, infinite]);

  // Read once per update - chess.js playing the line out is the costly part
  // - not again for each position stepped to while it's the latest.
  // One map for the hook's life, written to as lines are read.
  const [sanCache] = useState<SanCache>(() => new Map());
  const lines = useMemo(
    () =>
      update?.lines.map((line) => {
        // Kept from growing without end over a long session.
        if (sanCache.size > SAN_CACHE_SIZE) sanCache.clear();
        const sans = pvToSan(update.fen, line.pv, SAN_PLIES, sanCache);
        return {
          score: line.score,
          formatted: formatScore(line.score),
          sans,
          moves: numberMoves(update.fen, sans),
          pv: line.pv,
        };
      }) ?? [],
    [update, sanCache],
  );

  return useMemo(() => {
    // What was found for this position - or, while its search gets going,
    // the last one's, marked stale.
    if (!engine || !fen || !enabled) return OFF;
    if (!update) {
      return { status: 'thinking', depth: 0, lines: [], stale: false };
    }
    if (update.fen !== fen) {
      return { status: 'thinking', depth: update.depth, lines, stale: true };
    }
    return {
      status: update.done ? 'done' : 'thinking',
      depth: update.depth,
      lines,
      stale: false,
    };
  }, [engine, fen, enabled, update, lines]);
}
