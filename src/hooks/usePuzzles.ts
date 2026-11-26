import { useCallback, useEffect, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { patternsOf } from '../domain/review/patterns';
import {
  fromMine,
  fromPool,
  type SolvablePuzzle,
} from '../domain/puzzles/puzzle';
import type { PuzzleTheme } from '../domain/puzzles/themes';
import {
  attemptMyPuzzle,
  attemptPuzzle,
  getMyPuzzles,
  getNextPuzzle,
  getPatterns,
  getPuzzleRating,
} from '../network/restClient';
import {
  clearUnfinishedPuzzle,
  loadUnfinishedPuzzle,
  saveUnfinishedPuzzle,
} from '../network/puzzleProgressStorage';

export type PuzzleHome = {
  status: 'loading' | 'ready' | 'error';
  // Your own puzzles: due now, being learnt, learnt.
  mine: { due: number; learning: number; mastered: number };
  rating: number | null;
  // The themes your recent games slip on, the most often first.
  suggested: PuzzleTheme[];
  reload: () => Promise<void>;
};

const NO_MINE = { due: 0, learning: 0, mastered: 0 };

// The Puzzles tab's home: how your own deck stands, your puzzle rating, and
// the themes worth practising - from the patterns in your reviewed games.
// Loaded by `reload`, which its screen calls each time it's shown, since a
// run of puzzles changes it.
export function usePuzzleHome(): PuzzleHome {
  const session = useAuthSession();
  const { authorized } = session;
  const username = session.isReady ? session.user.username : null;
  const [status, setStatus] = useState<PuzzleHome['status']>('loading');
  const [mine, setMine] = useState(NO_MINE);
  const [rating, setRating] = useState<number | null>(null);
  const [suggested, setSuggested] = useState<PuzzleTheme[]>([]);

  const reload = useCallback(() => {
    if (!username) return Promise.resolve();
    return Promise.all([
      authorized((token) => getMyPuzzles(token)),
      authorized((token) => getPuzzleRating(token)),
      authorized((token) => getPatterns(username, token)).catch(() => null),
    ])
      .then(([own, puzzleRating, patterns]) => {
        setMine({
          due: own.dueCount,
          learning: own.learning,
          mastered: own.mastered,
        });
        setRating(Math.round(puzzleRating.rating));
        setSuggested(
          patterns
            ? patternsOf(patterns.games)
                .weakThemes.slice(0, 3)
                .map(({ theme }) => theme)
            : [],
        );
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [authorized, username]);

  return { status, mine, rating, suggested, reload };
}

export type PuzzleDeck = { deck: 'pool'; theme?: string } | { deck: 'mine' };

export type PuzzleRun = {
  status: 'loading' | 'ready' | 'done' | 'error';
  puzzle: SolvablePuzzle | null;
  // A pool puzzle's effect on your rating, once tried.
  ratingChange: { before: number; after: number } | null;
  // Record a puzzle's result: your rating moved, or your own put back on
  // its schedule.
  record: (solved: boolean) => void;
  next: () => void;
};

// A run of puzzles from a deck: the pool's, one after another near your
// rating (of a theme, if picked) - starting with the one you left
// unfinished, if you did; or your own due ones, until there are none left
// (one left unfinished is still due, so it comes first again).
export function usePuzzleRun(source: PuzzleDeck): PuzzleRun {
  const session = useAuthSession();
  const { authorized } = session;
  const userId = session.isReady ? session.user.id : null;
  const theme = source.deck === 'pool' ? source.theme : undefined;
  const deck = source.deck;
  const [status, setStatus] = useState<PuzzleRun['status']>('loading');
  const [queue, setQueue] = useState<SolvablePuzzle[]>([]);
  const [index, setIndex] = useState(0);
  const [ratingChange, setRatingChange] =
    useState<PuzzleRun['ratingChange']>(null);

  // The puzzle left unfinished under this theme, or else a new one, kept
  // as unfinished until it's tried.
  const nextFromPool = useCallback(async () => {
    const kept = userId ? await loadUnfinishedPuzzle(userId, theme) : null;
    if (kept) return kept;
    const next = await authorized((token) => getNextPuzzle(token, theme));
    if (next && userId) await saveUnfinishedPuzzle(userId, theme, next);
    return next;
  }, [authorized, userId, theme]);

  const load = useCallback(
    () =>
      (deck === 'mine'
        ? authorized((token) => getMyPuzzles(token)).then((own) =>
            own.due.map(fromMine),
          )
        : nextFromPool().then((next) => (next ? [fromPool(next)] : []))
      )
        .then((puzzles) => {
          setQueue(puzzles);
          setIndex(0);
          setStatus(puzzles.length > 0 ? 'ready' : 'done');
        })
        .catch(() => setStatus('error')),
    [authorized, deck, nextFromPool],
  );

  useEffect(() => {
    load();
  }, [load]);

  const puzzle = queue[index] ?? null;

  const record = useCallback(
    (solved: boolean) => {
      if (!puzzle) return;
      if (puzzle.kind === 'pool') {
        if (userId) clearUnfinishedPuzzle(userId, puzzle.id);
        authorized((token) => attemptPuzzle(puzzle.id, solved, token))
          .then(({ ratingBefore, ratingAfter }) =>
            setRatingChange({ before: ratingBefore, after: ratingAfter }),
          )
          .catch(() => {});
      } else {
        authorized((token) => attemptMyPuzzle(puzzle.id, solved, token)).catch(
          () => {},
        );
      }
    },
    [puzzle, authorized, userId],
  );

  const next = useCallback(() => {
    setRatingChange(null);
    if (deck === 'pool') {
      setStatus('loading');
      load();
      return;
    }
    if (index + 1 < queue.length) setIndex(index + 1);
    else setStatus('done');
  }, [deck, load, index, queue.length]);

  return { status, puzzle, ratingChange, record, next };
}
