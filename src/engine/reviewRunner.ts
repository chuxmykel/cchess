import { finalScore } from '../domain/evalScore';
import type { PositionEval } from '../domain/review/types';
import { AnalysisEngine, AnalysisRequest, EngineUpdate } from './types';

// One search to its end: the engine's last word on the position, once it's
// done. An engine runs one search at a time and drops any it's asked for
// before the last finishes, so a batch waits on each.
export function analyseOnce(
  engine: AnalysisEngine,
  request: AnalysisRequest,
  signal?: AbortSignal,
): Promise<EngineUpdate | null> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve(null);
    let last: EngineUpdate | null = null;
    const stop = engine.analyse(request, (update) => {
      if (update.lines.length > 0) last = update;
      if (!update.done) return;
      signal?.removeEventListener('abort', onAbort);
      resolve(last ?? update);
    });
    const onAbort = () => {
      stop();
      resolve(null);
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

// What a search makes of a position, as a review keeps it.
export function positionEvalOf(update: EngineUpdate): PositionEval {
  const [best, second] = update.lines;
  return {
    score: best?.score ?? { kind: 'cp', cp: 0 },
    pv: best?.pv ?? [],
    second: second?.score ?? null,
    depth: update.depth,
  };
}

export type ReviewRun = {
  engines: AnalysisEngine[];
  // Every position of the game, the start first.
  fens: string[];
  // Those already analysed - by an earlier run, cut short - aren't again.
  known: readonly (PositionEval | null | undefined)[];
  search: Omit<AnalysisRequest, 'fen'>;
  onEval: (index: number, positionEval: PositionEval) => void;
  signal?: AbortSignal;
};

// Analyses a game's positions, each engine taking the next one waiting as it
// finishes the last, so two engines take about half the time. A position
// with no moves left - mate, a draw - needs no search. Resolves once every
// position has its eval, or the run is stopped.
export async function runReview(run: ReviewRun): Promise<void> {
  const waiting: number[] = [];
  run.fens.forEach((fen, index) => {
    if (run.known[index]) return;
    const final = finalScore(fen);
    if (final) {
      run.onEval(index, { score: final, pv: [], second: null, depth: 0 });
    } else {
      waiting.push(index);
    }
  });
  const work = async (engine: AnalysisEngine) => {
    while (waiting.length > 0 && !run.signal?.aborted) {
      const index = waiting.shift()!;
      const update = await analyseOnce(
        engine,
        { fen: run.fens[index], ...run.search },
        run.signal,
      );
      if (!update) return;
      run.onEval(index, positionEvalOf(update));
    }
  };
  await Promise.all(run.engines.map(work));
}
