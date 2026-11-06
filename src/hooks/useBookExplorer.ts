import { useMemo } from 'react';

import { BookMove, bookMovesFrom } from '../domain/openings';
import { ExplorerMove } from '../network/restClient';
import { useOpeningExplorer } from './useOpeningExplorer';

/** A book move, with how it's done in games finished here - null where
 * none have played it, or before they've loaded. */
export type BookExplorerMove = BookMove & { results: ExplorerMove | null };

/**
 * The opening explorer's moves from a position: the book's, each with the
 * opening it reaches, shown at once - and how each has done in games
 * finished here, filled in once they've come. The most played first, then
 * the rest by name. A move played here that the book doesn't have isn't
 * one.
 */
export function useBookExplorer(fen: string): BookExplorerMove[] {
  const book = useMemo(() => bookMovesFrom(fen), [fen]);
  const explorer = useOpeningExplorer(fen, book.length > 0);
  const played = explorer.status === 'ready' ? explorer.position.moves : null;

  return useMemo(() => {
    const byUci = new Map(played?.map((move) => [move.uci, move]));
    return book
      .map((move) => ({ ...move, results: byUci.get(move.uci) ?? null }))
      .sort(
        (a, b) =>
          (b.results?.games ?? 0) - (a.results?.games ?? 0) ||
          a.opening.name.localeCompare(b.opening.name),
      );
  }, [book, played]);
}
