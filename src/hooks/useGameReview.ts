import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_POSITION } from 'chess.js';

import { ENGINE_VERSION } from '../constants/engine';
import {
  REVIEW_LINE_MOVES,
  REVIEW_MULTI_PV,
  REVIEW_SEARCH,
  ReviewStrength,
} from '../constants/review';
import { useAuthSession } from '../context/AuthSessionContext';
import { useEngineWhen } from '../context/EngineContext';
import { buildReview } from '../domain/review/buildReview';
import type { GameReview, PositionEval } from '../domain/review/types';
import { runReview } from '../engine/reviewRunner';
import { getGame, getGameReview, saveGameReview } from '../network/restClient';
import type { GameSnapshot } from '../network/socketEvents';
import { useAppIsActive } from './useAppIsActive';
import { startOfGame } from './useAnalysisSource';

// Why a game can't be reviewed: it's still being played, it was aborted or
// has no moves, or it began from a position it doesn't say.
export type ReviewUnavailableReason =
  'in-play' | 'aborted' | 'no-moves' | 'unknown-start';

export type GameReviewState =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | {
      status: 'unavailable';
      reason: ReviewUnavailableReason;
      snapshot: GameSnapshot;
    }
  | {
      status: 'analysing';
      snapshot: GameSnapshot;
      // How much of the game is analysed, 0 to 1 - and the engine's own
      // state, while it's downloaded the first time or starting.
      progress: number;
      engine:
        | { kind: 'downloading'; progress: number }
        | { kind: 'starting' }
        | { kind: 'running' }
        | { kind: 'error'; retry: () => void };
    }
  | { status: 'ready'; snapshot: GameSnapshot; review: GameReview };

type Loaded = {
  snapshot: GameSnapshot;
  // The game's positions, the start first, and its moves in UCI.
  fens: string[];
  uciMoves: string[];
  stored: PositionEval[] | null;
};

// What's been worked out of each game so far, by game and strength - so
// leaving a review half done and coming back carries on from there.
const partialEvals = new Map<string, (PositionEval | null)[]>();

// A review the server keeps is shown at once; otherwise the game's analysed
// here, on the device - two positions at a time, one on each of the
// engine's searches - and the review sent to the server, so nobody need
// analyse it again. Analysis waits while the app is in the background.
export function useGameReview(
  gameId: string,
  strength: ReviewStrength,
): GameReviewState {
  const { authorized } = useAuthSession();
  const active = useAppIsActive();
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  // How many positions are analysed - from where a review left off, when
  // it's come back to.
  const [analysed, setAnalysed] = useState(
    () =>
      partialEvals.get(`${gameId}:${strength}`)?.filter(Boolean).length ?? 0,
  );
  const [analysedReview, setAnalysedReview] = useState<GameReview | null>(null);

  const retry = useCallback(() => {
    setFailed(false);
    setAttempt((count) => count + 1);
  }, []);

  useEffect(() => {
    let current = true;
    Promise.all([
      authorized((token) => getGame(gameId, token)),
      authorized((token) => getGameReview(gameId, token)).catch(() => null),
    ])
      .then(([snapshot, stored]) => {
        if (!current) return;
        const start = startOfGame(snapshot);
        const uciMoves = start.uciMoves ?? [];
        const fens = [
          DEFAULT_POSITION,
          ...snapshot.moves.map((move) => move.fenAfter),
        ];
        setLoaded({
          snapshot,
          fens,
          uciMoves,
          stored:
            stored && stored.evals.length === fens.length ? stored.evals : null,
        });
      })
      .catch(() => {
        if (current) setFailed(true);
      });
    return () => {
      current = false;
    };
  }, [authorized, gameId, attempt]);

  const unavailable = useMemo((): ReviewUnavailableReason | null => {
    if (!loaded) return null;
    const { snapshot, uciMoves } = loaded;
    if (snapshot.status === 'active') return 'in-play';
    if (snapshot.status === 'aborted') return 'aborted';
    if (snapshot.moves.length === 0) return 'no-moves';
    if (uciMoves.length !== snapshot.moves.length) return 'unknown-start';
    return null;
  }, [loaded]);

  // A review kept on the server is built straight away.
  const storedReview = useMemo(
    () =>
      loaded?.stored && !unavailable
        ? buildReview(
            DEFAULT_POSITION,
            loaded.uciMoves.map((uci) => ({ uci })),
            loaded.stored,
            gameId,
          )
        : null,
    [loaded, unavailable, gameId],
  );
  const review = storedReview ?? analysedReview;
  const key = `${gameId}:${strength}`;

  const needsEngine = !!loaded && !loaded.stored && !unavailable && !review;
  const engine = useEngineWhen(needsEngine);
  const engines = engine.status.kind === 'ready' ? engine.status.engines : null;

  useEffect(() => {
    if (!needsEngine || !engines || !active || !loaded) return;
    const known =
      partialEvals.get(key) ??
      new Array<PositionEval | null>(loaded.fens.length).fill(null);
    partialEvals.set(key, known);
    const controller = new AbortController();
    runReview({
      engines: [engines.main, engines.threat],
      fens: loaded.fens,
      known,
      search: { multiPv: REVIEW_MULTI_PV, limit: REVIEW_SEARCH[strength] },
      signal: controller.signal,
      onEval: (index, positionEval) => {
        known[index] = {
          ...positionEval,
          pv: positionEval.pv.slice(0, REVIEW_LINE_MOVES),
        };
        if (!controller.signal.aborted) {
          setAnalysed(known.filter(Boolean).length);
        }
      },
    }).then(() => {
      if (controller.signal.aborted || known.some((e) => !e)) return;
      const complete = known as PositionEval[];
      const built = buildReview(
        DEFAULT_POSITION,
        loaded.uciMoves.map((uci) => ({ uci })),
        complete,
        gameId,
      );
      partialEvals.delete(key);
      setAnalysedReview(built);
      authorized((token) =>
        saveGameReview(
          gameId,
          {
            engine: ENGINE_VERSION,
            depth: REVIEW_SEARCH[strength].depth ?? built.depth,
            whiteAccuracy: built.white.accuracy,
            blackAccuracy: built.black.accuracy,
            evals: complete,
          },
          token,
        ),
      ).catch(() => {});
    });
    return () => controller.abort();
  }, [needsEngine, engines, active, loaded, gameId, key, strength, authorized]);

  return useMemo((): GameReviewState => {
    if (failed) return { status: 'error', retry };
    if (!loaded) return { status: 'loading' };
    const { snapshot } = loaded;
    if (unavailable)
      return { status: 'unavailable', reason: unavailable, snapshot };
    if (review) return { status: 'ready', snapshot, review };
    const progress = analysed / loaded.fens.length;
    const status = engine.status;
    return {
      status: 'analysing',
      snapshot,
      progress,
      engine:
        status.kind === 'downloading'
          ? { kind: 'downloading', progress: status.progress }
          : status.kind === 'error'
            ? { kind: 'error', retry: engine.retry }
            : status.kind === 'ready'
              ? { kind: 'running' }
              : { kind: 'starting' },
    };
  }, [failed, retry, loaded, unavailable, review, analysed, engine]);
}
