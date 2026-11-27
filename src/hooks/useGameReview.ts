import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, Color, DEFAULT_POSITION, Square } from 'chess.js';

import { ENGINE_VERSION } from '../constants/engine';
import {
  REVIEW_LINE_MOVES,
  REVIEW_MULTI_PV,
  REVIEW_SEARCH,
  ReviewStrength,
} from '../constants/review';
import { useAuthSession } from '../context/AuthSessionContext';
import { useEngineWhen } from '../context/EngineContext';
import type { ImportedGame, ImportedPlayer } from '../domain/pgnImport';
import { buildReview } from '../domain/review/buildReview';
import type { GameBadgeKind } from '../domain/badges';
import { reviewDigests } from '../domain/review/digest';
import { missedTactics } from '../domain/review/missedTactics';
import { colorPlayedBy } from '../domain/players';
import type { ReviewClock } from '../domain/review/time';
import type { GameReview, PositionEval } from '../domain/review/types';
import { runReview } from '../engine/reviewRunner';
import {
  addMyPuzzles,
  getGame,
  getGameReview,
  saveGameReview,
} from '../network/restClient';
import type { GameSnapshot, GameUserSummary } from '../network/socketEvents';
import { useAppIsActive } from './useAppIsActive';
import { startOfGame } from './useAnalysisSource';

// Why a game can't be reviewed: it's still being played, it was aborted or
// has no moves, or it began from a position it doesn't say.
export type ReviewUnavailableReason =
  'in-play' | 'aborted' | 'no-moves' | 'unknown-start';

// The game a review is of, whether played here or brought in: its seed -
// the game's id, or for one brought in, its moves - its players and result,
// and a live game's clock (none for a daily game, or one brought in).
export type ReviewedGame = {
  seed: string;
  white: GameUserSummary;
  black: GameUserSummary;
  result: GameSnapshot['result'];
  clock: ReviewClock | null;
  // The badges the server awarded each side for this game, its review's
  // included - none for a game brought in.
  badges: Record<Color, GameBadgeKind[]>;
};

const NO_BADGES: Record<Color, GameBadgeKind[]> = { w: [], b: [] };

// Each move's class and what it did, for the server's badges: a fact's
// piece after a colon ("fork:knight").
export function moveClassesOf(review: GameReview) {
  return review.moves.map((move) => ({
    moveClass: move.moveClass,
    facts: move.facts.map((fact) =>
      'piece' in fact ? `${fact.kind}:${fact.piece}` : fact.kind,
    ),
  }));
}

// A live game's clock, as the server recorded it; a daily game's is days.
function clockOf(snapshot: GameSnapshot): ReviewClock | null {
  if (snapshot.daysPerMove !== null) return null;
  return {
    initialMs: snapshot.initialSeconds * 1000,
    incrementMs: snapshot.incrementSeconds * 1000,
    afterMs: snapshot.moves.map((move) => move.clockAfterMs),
  };
}

// A position of the game, the start first, and the move that led there:
// drawn, and sounded, while it's analysed.
export type ReviewPosition = {
  fen: string;
  move: { from: Square; to: Square; san: string } | null;
};

export type GameReviewState =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | {
      status: 'unavailable';
      reason: ReviewUnavailableReason;
      game: ReviewedGame;
    }
  | {
      status: 'analysing';
      game: ReviewedGame;
      positions: ReviewPosition[];
      // How much of the game is analysed, 0 to 1 - and the engine's own
      // state, while it's downloaded the first time or starting.
      progress: number;
      engine:
        | { kind: 'downloading'; progress: number }
        | { kind: 'starting' }
        | { kind: 'running' }
        | { kind: 'error'; retry: () => void };
    }
  | { status: 'ready'; game: ReviewedGame; review: GameReview };

// A game brought in - a PGN pasted - to review: where it starts, its moves
// in UCI, and what its tags say.
export type ImportedReview = {
  startFen: string;
  uciMoves: string[];
  game: ImportedGame;
};

type Loaded = {
  game: ReviewedGame;
  startFen: string;
  // The game's positions, the start first, and its moves in UCI.
  positions: ReviewPosition[];
  uciMoves: string[];
  // Each side's rating going into the game, which its game rating is
  // anchored on - none for a guest.
  ratings: Record<Color, number | null>;
  stored: PositionEval[] | null;
};

// What's been worked out of each game so far, by game and strength - so
// leaving a review half done and coming back carries on from there.
const partialEvals = new Map<string, (PositionEval | null)[]>();

// The review of a game loaded: built at once from evals already kept, or
// else analysed here, on the device - two positions at a time, one on each
// of the engine's searches - and handed to `onComplete` with its evals.
// Analysis waits while the app is in the background.
function useReviewAnalysis(
  seed: string,
  strength: ReviewStrength,
  loaded: Loaded | null,
  unavailable: ReviewUnavailableReason | null,
  onComplete: (evals: PositionEval[], review: GameReview) => void,
) {
  const active = useAppIsActive();
  const key = `${seed}:${strength}`;
  // How many positions are analysed - from where a review left off, when
  // it's come back to.
  const [analysed, setAnalysed] = useState(
    () => partialEvals.get(key)?.filter(Boolean).length ?? 0,
  );
  const [analysedReview, setAnalysedReview] = useState<GameReview | null>(null);

  const storedReview = useMemo(
    () =>
      loaded?.stored && !unavailable
        ? buildReview(
            loaded.startFen,
            loaded.uciMoves.map((uci) => ({ uci })),
            loaded.stored,
            seed,
            loaded.ratings,
          )
        : null,
    [loaded, unavailable, seed],
  );
  const review = storedReview ?? analysedReview;

  const needsEngine = !!loaded && !loaded.stored && !unavailable && !review;
  const engine = useEngineWhen(needsEngine);
  const engines = engine.status.kind === 'ready' ? engine.status.engines : null;

  useEffect(() => {
    if (!needsEngine || !engines || !active || !loaded) return;
    const fens = loaded.positions.map((position) => position.fen);
    const known =
      partialEvals.get(key) ??
      new Array<PositionEval | null>(fens.length).fill(null);
    partialEvals.set(key, known);
    const controller = new AbortController();
    runReview({
      engines: [engines.main, engines.threat],
      fens,
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
        loaded.startFen,
        loaded.uciMoves.map((uci) => ({ uci })),
        complete,
        seed,
        loaded.ratings,
      );
      partialEvals.delete(key);
      setAnalysedReview(built);
      onComplete(complete, built);
    });
    return () => controller.abort();
  }, [needsEngine, engines, active, loaded, seed, key, strength, onComplete]);

  // The same object until one of them changes, so the state built from it
  // is too.
  return useMemo(
    () => ({ review, analysed, engine }),
    [review, analysed, engine],
  );
}

// The state a review is in, once its game's loaded.
function reviewState(
  loaded: Loaded,
  unavailable: ReviewUnavailableReason | null,
  { review, analysed, engine }: ReturnType<typeof useReviewAnalysis>,
): GameReviewState {
  const { game, positions } = loaded;
  if (unavailable) return { status: 'unavailable', reason: unavailable, game };
  if (review) return { status: 'ready', game, review };
  const status = engine.status;
  return {
    status: 'analysing',
    game,
    positions,
    progress: analysed / positions.length,
    engine:
      status.kind === 'downloading'
        ? { kind: 'downloading', progress: status.progress }
        : status.kind === 'error'
          ? { kind: 'error', retry: engine.retry }
          : status.kind === 'ready'
            ? { kind: 'running' }
            : { kind: 'starting' },
  };
}

// A game played here: a review the server keeps is shown at once;
// otherwise the game's analysed on the device and the review sent to the
// server, so nobody need analyse it again.
export function useGameReview(
  gameId: string,
  strength: ReviewStrength,
): GameReviewState {
  const auth = useAuthSession();
  const { authorized } = auth;
  const userId = auth.isReady ? auth.user.id : null;
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [failed, setFailed] = useState(false);
  // The badges the server awarded once the review was saved.
  const [awarded, setAwarded] = useState<Record<Color, GameBadgeKind[]> | null>(
    null,
  );

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
      .then(([fetched, stored]) => {
        if (!current) return;
        const start = startOfGame(fetched);
        const positions: ReviewPosition[] = [
          { fen: DEFAULT_POSITION, move: null },
          ...fetched.moves.map(({ fenAfter, from, to, san }) => ({
            fen: fenAfter,
            move: { from, to, san },
          })),
        ];
        setSnapshot(fetched);
        setLoaded({
          game: {
            seed: gameId,
            white: fetched.white,
            black: fetched.black,
            result: fetched.result,
            clock: clockOf(fetched),
            badges: stored?.badges ?? NO_BADGES,
          },
          startFen: DEFAULT_POSITION,
          positions,
          uciMoves: start.uciMoves ?? [],
          ratings: { w: fetched.white.rating, b: fetched.black.rating },
          stored:
            stored && stored.evals.length === positions.length
              ? stored.evals
              : null,
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
    if (!loaded || !snapshot) return null;
    if (snapshot.status === 'active') return 'in-play';
    if (snapshot.status === 'aborted') return 'aborted';
    if (snapshot.moves.length === 0) return 'no-moves';
    if (loaded.uciMoves.length !== snapshot.moves.length)
      return 'unknown-start';
    return null;
  }, [loaded, snapshot]);

  const save = useCallback(
    (evals: PositionEval[], built: GameReview) => {
      authorized((token) =>
        saveGameReview(
          gameId,
          {
            engine: ENGINE_VERSION,
            depth: REVIEW_SEARCH[strength].depth ?? built.depth,
            whiteAccuracy: built.white.accuracy,
            blackAccuracy: built.black.accuracy,
            evals,
            digests: loaded
              ? reviewDigests(built, loaded.game.result, loaded.game.clock)
              : undefined,
            moveClasses: moveClassesOf(built),
          },
          token,
        ),
      )
        // The badges the review earned, awarded by the server.
        .then((saved) => setAwarded(saved.badges ?? null))
        .catch(() => {});
    },
    [authorized, gameId, strength, loaded],
  );
  const analysis = useReviewAnalysis(
    gameId,
    strength,
    loaded,
    unavailable,
    save,
  );

  // Once the review's ready: the tactics the player missed, kept to
  // practise - sent once, and nothing lost if it fails (the next look sends
  // them again).
  const ready = analysis.review;
  const sentFor = useRef<GameReview | null>(null);
  useEffect(() => {
    if (!loaded || !ready || unavailable || sentFor.current === ready) return;
    sentFor.current = ready;
    const color = userId ? colorPlayedBy(loaded.game, userId) : null;
    const missed = color ? missedTactics(ready, color) : [];
    if (missed.length > 0) {
      authorized((token) => addMyPuzzles(gameId, missed, token)).catch(
        () => {},
      );
    }
  }, [loaded, ready, unavailable, authorized, gameId, userId]);

  return useMemo((): GameReviewState => {
    if (failed) return { status: 'error', retry };
    if (!loaded) return { status: 'loading' };
    return reviewState(
      awarded
        ? { ...loaded, game: { ...loaded.game, badges: awarded } }
        : loaded,
      unavailable,
      analysis,
    );
  }, [failed, retry, loaded, unavailable, analysis, awarded]);
}

// A side of a game brought in, as a player: named by its tag, or by its
// color - the theme's own avatar, with no account behind it.
function importedPlayer(
  player: ImportedPlayer,
  fallbackName: string,
): GameUserSummary {
  return {
    id: '',
    username: '',
    displayName: player.name ?? fallbackName,
    avatarColor: '',
    rating: player.rating,
    provisional: false,
  };
}

const keepNothing = () => {};

// What a game brought in is known by - its review's seed, and where it's
// kept while half done.
export function importedReviewSeed({
  startFen,
  uciMoves,
}: Pick<ImportedReview, 'startFen' | 'uciMoves'>): string {
  return `import:${startFen}:${uciMoves.join(' ')}`;
}

// A game brought in - a PGN pasted: analysed on the device each time it's
// reviewed, since there's no game on the server to keep its review with.
export function useImportedGameReview(
  imported: ImportedReview,
  strength: ReviewStrength,
): GameReviewState {
  const { startFen, uciMoves, game } = imported;
  const seed = importedReviewSeed(imported);
  const loaded = useMemo((): Loaded => {
    const chess = new Chess(startFen);
    const positions: ReviewPosition[] = [{ fen: startFen, move: null }];
    for (const uci of uciMoves) {
      const move = chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci[4],
      });
      positions.push({
        fen: move.after,
        move: { from: move.from, to: move.to, san: move.san },
      });
    }
    return {
      game: {
        seed,
        white: importedPlayer(game.white, 'White'),
        black: importedPlayer(game.black, 'Black'),
        result: game.result,
        clock: null,
        badges: NO_BADGES,
      },
      startFen,
      positions,
      uciMoves,
      ratings: { w: game.white.rating, b: game.black.rating },
      stored: null,
    };
  }, [startFen, uciMoves, game, seed]);
  const unavailable = uciMoves.length === 0 ? 'no-moves' : null;
  const analysis = useReviewAnalysis(
    seed,
    strength,
    loaded,
    unavailable,
    keepNothing,
  );
  return useMemo(
    () => reviewState(loaded, unavailable, analysis),
    [loaded, unavailable, analysis],
  );
}
