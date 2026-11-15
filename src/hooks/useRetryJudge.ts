import { useCallback, useEffect, useRef, useState } from 'react';

import { EngineScore, finalScore } from '../domain/evalScore';
import { CLASS_THRESHOLDS } from '../domain/review/classifyMove';
import type { ReviewedMove } from '../domain/review/types';
import { winPercent } from '../domain/review/winChances';
import { useEngineWhen } from '../context/EngineContext';
import { analyseOnce } from '../engine/reviewRunner';
import { AnalysisEngine } from '../engine/types';
import type { RetryJudge } from './useReviewStepper';

// A quick look - a tried move needs only roughly the review's own depth.
const JUDGE_LIMIT = { depth: 12, movetimeMs: 1000 };

// Judges a move tried in a review's Retry: good enough when it gives away
// no more than an excellent move would. The engine's started only once a
// Retry's under way, and waited on if it's still starting.
export function useRetryJudge(retrying: boolean): RetryJudge {
  const [needed, setNeeded] = useState(false);
  const { status } = useEngineWhen(retrying || needed);
  const engine = status.kind === 'ready' ? status.engines.main : null;
  const waiting = useRef<((engine: AnalysisEngine | null) => void)[]>([]);

  useEffect(() => {
    if (!engine && status.kind !== 'error') return;
    const resolvers = waiting.current.splice(0);
    resolvers.forEach((resolve) => resolve(engine));
  }, [engine, status.kind]);

  return useCallback(
    async (move: ReviewedMove, _uci: string, fenAfter: string) => {
      // A mate, or a draw, needs no search.
      const final = finalScore(fenAfter);
      if (final) return isGoodEnough(move, final);
      setNeeded(true);
      const ready =
        engine ??
        (await new Promise<AnalysisEngine | null>((resolve) =>
          waiting.current.push(resolve),
        ));
      if (!ready) return false;
      const update = await analyseOnce(ready, {
        fen: fenAfter,
        multiPv: 1,
        limit: JUDGE_LIMIT,
      });
      const score = update?.lines[0]?.score;
      return score ? isGoodEnough(move, score) : false;
    },
    [engine],
  );
}

function isGoodEnough(move: ReviewedMove, score: EngineScore): boolean {
  const loss =
    winPercent(move.scoreBefore, move.color) - winPercent(score, move.color);
  return loss < CLASS_THRESHOLDS.excellent;
}
