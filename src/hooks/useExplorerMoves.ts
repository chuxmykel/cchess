import { useMemo } from 'react';

import { bookMovesFrom, Opening } from '../domain/openings';
import {
  ExplorerMove,
  ExplorerQuery,
  ExplorerSource,
} from '../network/restClient';
import { useOpeningExplorer } from './useOpeningExplorer';

/** A move from a position: the opening it reaches, if it's a book move, and
 * how it's done in the database - null where none have played it, or
 * before the answer's come. */
export type ExplorerMoveRow = {
  san: string;
  uci: string;
  opening: Opening | null;
  results: ExplorerMove | null;
};

export type ExplorerTotals = {
  games: number;
  whiteWins: number;
  draws: number;
  blackWins: number;
};

export type ExplorerMoves = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  moves: ExplorerMoveRow[];
  /** The position's own games, once they've come. */
  totals: ExplorerTotals | null;
  /** Where they came from - not the database asked when lichess was out
   * of reach. */
  source: ExplorerSource | null;
  stale: boolean;
};

/**
 * The opening explorer's moves from a position, in the database `query`
 * names: the book's are shown at once, each with the opening it reaches;
 * once the database answers, its moves come first, the most played first
 * - named where they're in the book - then the book's no one has played,
 * by name.
 */
export function useExplorerMoves(
  fen: string,
  query: ExplorerQuery | null,
): ExplorerMoves {
  const book = useMemo(() => bookMovesFrom(fen), [fen]);
  const explorer = useOpeningExplorer(fen, query);
  const position = explorer.status === 'ready' ? explorer.position : null;

  return useMemo(() => {
    const openings = new Map(book.map((move) => [move.uci, move.opening]));
    const played = position?.moves ?? [];
    const playedUci = new Set(played.map((move) => move.uci));
    const unplayed = book
      .filter((move) => !playedUci.has(move.uci))
      .sort((a, b) => a.opening.name.localeCompare(b.opening.name));
    return {
      status: explorer.status,
      moves: [
        ...played.map((move) => ({
          san: move.san,
          uci: move.uci,
          opening: openings.get(move.uci) ?? null,
          results: move,
        })),
        ...unplayed.map((move) => ({
          san: move.san,
          uci: move.uci,
          opening: move.opening,
          results: null,
        })),
      ],
      totals: position && {
        games: position.totalGames,
        whiteWins: position.whiteWins,
        draws: position.draws,
        blackWins: position.blackWins,
      },
      source: position?.source ?? null,
      stale: position?.stale ?? false,
    };
  }, [book, position, explorer.status]);
}
