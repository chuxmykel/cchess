import { useLayoutEffect, useRef, useState } from 'react';
import {
  makeMutable,
  SharedValue,
  withTiming,
  WithTimingConfig,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { MOVE_TIMING } from '../constants';
import { getXYFromSquare } from '../coordinates';
import { IdentifiedPiece, matchPieces } from '../matchPieces';
import {
  BoardPiece,
  Color,
  MoveSquares,
  PieceCode,
  PieceSymbol,
  Point,
  Square,
} from '../types';

// A piece as the board draws it: an identity kept from one position to the
// next - so a piece that moves is the same piece, sliding, not a new one
// drawn in its place - plus the shared values that place it on the board,
// written on the UI thread by moves and drags alike. For a moment after a
// move takes it, the piece taken too (see `captured`).
//
// Positions are always from white's side (a1 bottom-left), whichever way the
// board faces: the board turns the whole pieces layer round for black (see
// Chessboard), so a flip is drawn in the same frame as the squares, rather
// than a frame later as every piece's shared values catch up.
export type TrackedPiece = {
  id: string;
  spriteId: PieceCode;
  square: Square;
  // The top-left corner of the piece, from white's side.
  x: SharedValue<number>;
  y: SharedValue<number>;
  // A piece just taken, still drawn on its square until the piece taking it
  // lands there, so it's seen being taken rather than vanishing first.
  captured?: boolean;
};

export type PieceTrackerInput = {
  pieces: BoardPiece[];
  // The move that led here. A new position whose `lastMove` is new too, and
  // whose piece has left `lastMove.from`, is that move being played;
  // anything else is a position set without a move.
  lastMove: MoveSquares | null;
  squareSize: number;
  // A pawn waiting on a promotion choice, stood on its promotion square.
  promotion?: MoveSquares | null;
  // Slide pieces to their squares; otherwise they're put there at once.
  animate?: boolean;
  // Slide them into a position set without a move as well, rather than put
  // them all straight there.
  slideOnSet?: boolean;
  // Once every piece has reached its square after a change.
  onSettled?: () => void;
};

type PendingAnimation = { pieceEntry: TrackedPiece; toSquare: Square };

let nextPieceId = 0;

/** Moves a piece to `to` on the UI thread - or puts it there, with no
 * `config` - and `onLanded` (on the JS thread) once it's there, or once a
 * drag or a newer move takes it over. */
export function animatePieceTo(
  piece: Pick<TrackedPiece, 'x' | 'y'>,
  to: Point,
  config: WithTimingConfig | null,
  onLanded?: () => void,
) {
  if (!config) {
    piece.x.set(to.x);
    piece.y.set(to.y);
    onLanded?.();
    return;
  }
  // Each axis is animated on its own, so the landing waits for both.
  let settling = 2;
  const settle = () => {
    settling -= 1;
    if (settling === 0) onLanded?.();
  };
  const onAxisDone = onLanded
    ? () => {
        'worklet';
        scheduleOnRN(settle);
      }
    : undefined;
  piece.x.set(withTiming(to.x, config, onAxisDone));
  piece.y.set(withTiming(to.y, config, onAxisDone));
}

function sameMove(a: MoveSquares | null, b: MoveSquares | null) {
  return a?.from === b?.from && a?.to === b?.to;
}

function toPiece(entry: TrackedPiece): IdentifiedPiece {
  return {
    id: entry.id,
    square: entry.square,
    color: entry.spriteId[0] as Color,
    type: entry.spriteId[1] as PieceSymbol,
  };
}

// Keeps each piece of the position the same piece from one position to the
// next, and moves it there: a move slides its pieces (unless `animate` is
// off) and keeps the piece it took drawn under the one taking it until that
// lands; a position set without a move - a refused move taken back - puts
// them straight there, or slides them with `slideOnSet`.
export function usePieceTracker({
  pieces,
  lastMove,
  squareSize,
  promotion = null,
  animate = true,
  slideOnSet = false,
  onSettled,
}: PieceTrackerInput): TrackedPiece[] {
  // This hook keeps its piece/animation bookkeeping in mutable refs that
  // are read and written synchronously during render, not inside an
  // effect, so it can incrementally diff `pieces` against the previous
  // render's cached result instead of recomputing it from scratch every
  // time - and so a new position draws its pieces in their old places
  // first, then they move. None of these refs ever drive what gets rendered
  // on their own - they're deliberately invisible to React's reactivity,
  // the same way `useRef` is meant to be used. This is exactly what
  // react-hooks/refs is warning about, but it's a React-Compiler-readiness
  // rule, not a correctness bug under React's current (non-compiled)
  // runtime: nothing here actually uses the compiler. Revisit this hook
  // specifically if this project ever turns the compiler on.
  /* eslint-disable react-hooks/refs */
  const entryById = useRef(new Map<string, TrackedPiece>());
  const pieceIdBySquare = useRef(new Map<Square, string>());
  const initialized = useRef(false);
  const pendingAnimations = useRef<PendingAnimation[]>([]);
  // A change waiting for the layout effect to set it going - and report it
  // settled.
  const changed = useRef(false);
  // The pieces the last move moved, drawn after (so over) the rest - they
  // pass over the pieces they cross, and land on top of the one they take.
  const movedIds = useRef(new Set<string>());
  // The piece the last move took, drawn until the mover lands.
  const capturedViews = useRef<TrackedPiece[]>([]);
  // Bumped on every change, so a landing that comes after a newer move
  // started doesn't clear that move's captured piece.
  const changeCount = useRef(0);
  const prevPieces = useRef<BoardPiece[] | null>(null);
  const prevLastMove = useRef<MoveSquares | null>(lastMove);
  const prevCapturedViews = useRef<TrackedPiece[]>([]);
  const prevOrderedPromotion = useRef(promotion);
  const prevResult = useRef<TrackedPiece[]>([]);
  const prevPromotion = useRef(promotion);
  const latestOnSettled = useRef(onSettled);
  useLayoutEffect(() => {
    latestOnSettled.current = onSettled;
  });
  // Only to re-render once a captured piece is gone.
  const [, setLandings] = useState(0);

  function createEntry(piece: BoardPiece): TrackedPiece {
    const position = getXYFromSquare(piece.square, squareSize);
    return {
      id: `${piece.color}${piece.type}-${piece.square}-${nextPieceId++}`,
      square: piece.square,
      spriteId: `${piece.color}${piece.type}`,
      x: makeMutable(position.x),
      y: makeMutable(position.y),
    };
  }

  function store(entries: Map<string, TrackedPiece>) {
    entryById.current = entries;
    pieceIdBySquare.current = new Map(
      [...entries.values()].map((entry) => [entry.square, entry.id]),
    );
  }

  // Matches the bookkeeping to `pieces` as they stand: a piece already on
  // its square keeps its entry (and shared values), anything else gets a
  // fresh one placed straight there.
  function placeAll() {
    const entries = new Map<string, TrackedPiece>();
    pieces.forEach((piece) => {
      const pieceId = pieceIdBySquare.current.get(piece.square);
      const existing = pieceId && entryById.current.get(pieceId);
      const pieceEntry =
        existing && existing.spriteId === `${piece.color}${piece.type}`
          ? existing
          : createEntry(piece);
      entries.set(pieceEntry.id, pieceEntry);
    });
    store(entries);
    movedIds.current = new Set();
    capturedViews.current = [];
  }

  // Matches the bookkeeping to `pieces` by which piece is which (see
  // matchPieces): each keeps its entry and slides to its new square, taking
  // a promotion's new kind; a piece that's appeared is new, and placed
  // there. On a move, a piece that's gone was taken, and stays drawn until
  // the pieces moving land.
  function slideAll(asMove: boolean): PendingAnimation[] {
    const previous = [...entryById.current.values()];
    const matched = matchPieces(previous.map(toPiece), pieces, () => '');
    const entries = new Map<string, TrackedPiece>();
    const animations: PendingAnimation[] = [];
    matched.forEach((piece) => {
      const existing = piece.id ? entryById.current.get(piece.id) : undefined;
      const pieceEntry = existing ?? createEntry(piece);
      if (existing && existing.square !== piece.square) {
        existing.square = piece.square;
        animations.push({ pieceEntry: existing, toSquare: piece.square });
      }
      pieceEntry.spriteId = `${piece.color}${piece.type}`;
      entries.set(pieceEntry.id, pieceEntry);
    });
    // A new object, not the entry itself, so the piece re-renders as taken -
    // out of reach of any touch.
    capturedViews.current = asMove
      ? previous
          .filter((entry) => !entries.has(entry.id))
          .map((entry) => ({ ...entry, captured: true }))
      : [];
    store(entries);
    movedIds.current = new Set(
      animations.map(({ pieceEntry }) => pieceEntry.id),
    );
    return animations;
  }

  // Whether this new position is `lastMove` being played: it's a move the
  // board hasn't seen, and the piece that stood on its first square has
  // left it. (For a castle marked king-square to rook-square, the king has.)
  function isPlayed(move: MoveSquares | null): boolean {
    if (!move || sameMove(move, prevLastMove.current)) return false;
    const leaverId = pieceIdBySquare.current.get(move.from);
    const leaver = leaverId && entryById.current.get(leaverId);
    if (!leaver) return false;
    return !pieces.some(
      (piece) =>
        piece.square === move.from &&
        `${piece.color}${piece.type}` === leaver.spriteId,
    );
  }

  if (!initialized.current) {
    initialized.current = true;
    placeAll();
    changed.current = true;
  } else if (pieces !== prevPieces.current) {
    changeCount.current += 1;
    changed.current = true;
    if (isPlayed(lastMove)) pendingAnimations.current = slideAll(true);
    else if (slideOnSet) pendingAnimations.current = slideAll(false);
    else {
      pendingAnimations.current = [];
      placeAll();
    }
  }
  prevLastMove.current = lastMove;

  // A layout effect, so a move is already under way in the first frame that
  // shows its new position.
  useLayoutEffect(() => {
    if (!changed.current) return;
    changed.current = false;
    const animations = pendingAnimations.current;
    pendingAnimations.current = [];
    const change = changeCount.current;
    let travelling = animations.length;
    // All landed (or cut short by a drag or a newer move): the piece taken
    // goes now - unless a newer move has its own captured piece showing.
    const settled = () => {
      if (change !== changeCount.current) return;
      if (capturedViews.current.length > 0) {
        capturedViews.current = [];
        setLandings((count) => count + 1);
      }
      latestOnSettled.current?.();
    };
    if (travelling === 0) {
      settled();
      return;
    }
    const onLanded = () => {
      travelling -= 1;
      if (travelling === 0) settled();
    };
    animations.forEach(({ pieceEntry, toSquare }) => {
      animatePieceTo(
        pieceEntry,
        getXYFromSquare(toSquare, squareSize),
        animate ? MOVE_TIMING : null,
        onLanded,
      );
    });
  });

  // A board drawn at a new size - narrowed for an eval bar beside it - puts
  // every piece straight onto its square at that size.
  const prevSquareSize = useRef(squareSize);
  useLayoutEffect(() => {
    if (prevSquareSize.current === squareSize) return;
    prevSquareSize.current = squareSize;
    entryById.current.forEach((entry) =>
      animatePieceTo(entry, getXYFromSquare(entry.square, squareSize), null),
    );
  }, [squareSize]);

  // A pawn waiting on a promotion choice stands on the square it's
  // promoting on - where it was dropped, or where it was tapped to - and
  // goes back if the promotion is called off. Once it's played, the move
  // picks it up from there.
  useLayoutEffect(() => {
    const previous = prevPromotion.current;
    prevPromotion.current = promotion;
    const pending = promotion ?? previous;
    if (!pending) return;
    const pieceId = pieceIdBySquare.current.get(pending.from);
    const pawn = pieceId && entryById.current.get(pieceId);
    // Already gone from `from`: the promotion was played.
    if (!pawn) return;
    animatePieceTo(
      pawn,
      getXYFromSquare(promotion ? pending.to : pending.from, squareSize),
      animate ? MOVE_TIMING : null,
    );
  }, [promotion, squareSize, animate]);

  if (
    pieces !== prevPieces.current ||
    capturedViews.current !== prevCapturedViews.current ||
    promotion !== prevOrderedPromotion.current
  ) {
    prevPieces.current = pieces;
    prevCapturedViews.current = capturedViews.current;
    prevOrderedPromotion.current = promotion;
    const views = pieces.map((piece) => {
      const pieceId = pieceIdBySquare.current.get(piece.square);
      const pieceEntry = pieceId ? entryById.current.get(pieceId) : undefined;
      if (!pieceEntry) {
        // Should be unreachable if the bookkeeping above stayed in sync with
        // `pieces` - fall back to a fresh, unanimated view rather than crash.
        const fallback = createEntry(piece);
        pieceIdBySquare.current.set(piece.square, fallback.id);
        entryById.current.set(fallback.id, fallback);
        return fallback;
      }
      return pieceEntry;
    });
    // Later is drawn over earlier: the piece just taken under everything,
    // the pieces just moved - or a pawn standing on its promotion square -
    // over everything.
    const onTop = new Set(movedIds.current);
    if (promotion) {
      onTop.add(pieceIdBySquare.current.get(promotion.from));
    }
    prevResult.current = [
      ...capturedViews.current,
      ...views.filter((view) => !onTop.has(view.id)),
      ...views.filter((view) => onTop.has(view.id)),
    ];
  }
  return prevResult.current;
  /* eslint-enable react-hooks/refs */
}
