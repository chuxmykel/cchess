import { DomainPiece } from './types';

export type IdentifiedPiece = DomainPiece & { id: string };

function distance(a: DomainPiece, b: DomainPiece): number {
  const files = a.square.charCodeAt(0) - b.square.charCodeAt(0);
  const ranks = a.square.charCodeAt(1) - b.square.charCodeAt(1);
  return Math.hypot(files, ranks);
}

// Carries each piece's identity from one position to the next, so a board
// can move the same piece rather than draw a new one: a piece still on its
// square keeps its id; one that moved takes the id of the nearest piece of
// its kind that left - a move, a castle, an en passant capture, or several
// moves at once - and a piece that changed kind takes the nearest of its
// colour's that's left over, so a promoted piece is the pawn that promoted.
// Anything still unmatched is new (`newId`), as a piece taken back is when
// stepping back through a game; pieces of `previous` left out are gone.
export function matchPieces(
  previous: IdentifiedPiece[],
  next: DomainPiece[],
  newId: () => string,
): IdentifiedPiece[] {
  const unclaimed = new Set(previous);
  const ids = new Map<DomainPiece, string>();

  const claim = (
    piece: DomainPiece,
    fits: (candidate: IdentifiedPiece) => boolean,
  ) => {
    let best: IdentifiedPiece | undefined;
    for (const candidate of unclaimed) {
      if (!fits(candidate)) continue;
      if (!best || distance(candidate, piece) < distance(best, piece)) {
        best = candidate;
      }
    }
    if (best) {
      unclaimed.delete(best);
      ids.set(piece, best.id);
    }
  };

  const unmatched = () => next.filter((piece) => !ids.has(piece));
  next.forEach((piece) =>
    claim(
      piece,
      (c) =>
        c.square === piece.square &&
        c.color === piece.color &&
        c.type === piece.type,
    ),
  );
  unmatched().forEach((piece) =>
    claim(piece, (c) => c.color === piece.color && c.type === piece.type),
  );
  unmatched().forEach((piece) => claim(piece, (c) => c.color === piece.color));

  return next.map((piece) => ({ ...piece, id: ids.get(piece) ?? newId() }));
}
