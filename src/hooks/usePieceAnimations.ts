import { useLayoutEffect, useRef, useState } from 'react';
import {
  makeMutable,
  SharedValue,
  withSpring,
  WithSpringConfig,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Color, PieceSymbol, Square } from 'chess.js';

import { AppliedMove, DomainPiece, Position } from '../domain/types';
import { getXYFromSquare } from '../domain/boardCoordinates';
import { generatePieceId } from '../utils/animation';
import { MOVE_SPRING } from '../constants/animations';

type SpriteId = `${Color}${PieceSymbol}`;

// The RN-aware view of a piece: a stable identity plus the shared values
// that place it on screen - written on the UI thread by springs and drags
// alike. Mirrors a DomainPiece 1:1 - plus, for a moment after a capture, the
// piece just taken (see `captured`).
export type AnimatedPieceView = {
  id: string;
  spriteId: SpriteId;
  square: Square;
  // The top-left corner of the piece.
  x: SharedValue<number>;
  y: SharedValue<number>;
  // A piece just taken, still drawn on its square until the piece taking it
  // lands there, so it's seen being taken rather than vanishing first.
  captured?: boolean;
};

type PendingAnimation = { pieceEntry: AnimatedPieceView; toSquare: Square };

/** Springs a piece to `to` on the UI thread; `onLanded` (on the JS thread)
 * once it's there, or once a drag or a newer spring takes it over. */
export function springPieceTo(
  piece: Pick<AnimatedPieceView, 'x' | 'y'>,
  to: Position,
  config: WithSpringConfig,
  onLanded?: () => void,
) {
  // Each axis is its own spring, and one that doesn't travel ends at once -
  // so the landing waits for both.
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
  piece.x.set(withSpring(to.x, config, onAxisDone));
  piece.y.set(withSpring(to.y, config, onAxisDone));
}

export function usePieceAnimations(
  pieces: DomainPiece[],
  lastMove: AppliedMove | null,
  pieceWidth: number,
  orientation: Color = 'w',
  pendingPromotion: { from: Square; to: Square } | null = null,
): AnimatedPieceView[] {
  // This hook keeps its piece/animation bookkeeping in mutable refs that
  // are read and written synchronously during render, not inside an
  // effect, so it can incrementally diff `pieces`/`lastMove` against the
  // previous render's cached result instead of recomputing it from
  // scratch every time. None of these refs ever drive what gets rendered
  // on their own - they're deliberately invisible to React's reactivity,
  // the same way `useRef` is meant to be used. This is exactly what
  // react-hooks/refs is warning about, but it's a React-Compiler-readiness
  // rule, not a correctness bug under React's current (non-compiled)
  // runtime: nothing here actually uses the compiler. Revisit this hook
  // specifically if this project ever turns the compiler on - until then,
  // rewriting it to avoid ref access during render would mean moving this
  // bookkeeping into real state and re-deriving it with useMemo, which
  // risks regressing piece-move animations for no present benefit.
  /* eslint-disable react-hooks/refs */
  const pieceIdBySquare = useRef(new Map<Square, string>());
  const entryById = useRef(new Map<string, AnimatedPieceView>());
  const initialized = useRef(false);
  const processedMove = useRef<AppliedMove | null>(null);
  const pendingAnimations = useRef<PendingAnimation[]>([]);
  // The pieces the last move moved, drawn after (so over) the rest - they
  // pass over the pieces they cross, and land on top of the one they take.
  const movedIds = useRef(new Set<string>());
  // The piece the last move took, drawn until the mover lands.
  const capturedViews = useRef<AnimatedPieceView[]>([]);
  // Bumped on every move or new position, so a landing that comes after
  // a newer move started doesn't clear that move's captured piece.
  const moveCount = useRef(0);
  const prevPieces = useRef<DomainPiece[] | null>(null);
  const prevCapturedViews = useRef<AnimatedPieceView[]>([]);
  const prevOrderedPromotion = useRef(pendingPromotion);
  const prevResult = useRef<AnimatedPieceView[]>([]);
  const prevOrientation = useRef(orientation);
  const prevPendingPromotion = useRef(pendingPromotion);
  // Only to re-render once a captured piece is gone.
  const [, setLandings] = useState(0);

  function createEntry(piece: DomainPiece): AnimatedPieceView {
    const position = getXYFromSquare(piece.square, pieceWidth, orientation);
    return {
      id: generatePieceId(piece.color, piece.type, piece.square),
      square: piece.square,
      spriteId: `${piece.color}${piece.type}`,
      x: makeMutable(position.x),
      y: makeMutable(position.y),
    };
  }

  function movePiece(from: Square, to: Square, animations: PendingAnimation[]) {
    const pieceId = pieceIdBySquare.current.get(from);
    const pieceEntry = pieceId && entryById.current.get(pieceId);
    if (!pieceId || !pieceEntry) return;
    pieceIdBySquare.current.delete(from);
    pieceIdBySquare.current.set(to, pieceId);
    pieceEntry.square = to;
    animations.push({ pieceEntry, toSquare: to });
  }

  function removePiece(square: Square): AnimatedPieceView | undefined {
    const pieceId = pieceIdBySquare.current.get(square);
    if (!pieceId) return undefined;
    const pieceEntry = entryById.current.get(pieceId);
    pieceIdBySquare.current.delete(square);
    entryById.current.delete(pieceId);
    return pieceEntry;
  }

  function applyMove(move: AppliedMove): PendingAnimation[] {
    const animations: PendingAnimation[] = [];
    capturedViews.current = [];

    if (move.isCapture && move.capturedSquare) {
      const taken = removePiece(move.capturedSquare);
      // A new object, not the entry itself, so the piece re-renders as
      // taken - out of reach of any touch.
      if (taken) capturedViews.current = [{ ...taken, captured: true }];
    }
    if (move.rookFrom && move.rookTo) {
      movePiece(move.rookFrom, move.rookTo, animations);
    }
    movePiece(move.from, move.to, animations);
    movedIds.current = new Set(
      animations.map(({ pieceEntry }) => pieceEntry.id),
    );

    if (move.isPromotion && move.promotionPiece) {
      const pieceId = pieceIdBySquare.current.get(move.to);
      const pieceEntry = pieceId && entryById.current.get(pieceId);
      if (pieceEntry) {
        pieceEntry.spriteId = `${move.color}${move.promotionPiece}`;
      }
    }

    return animations;
  }

  // Matches the bookkeeping to `pieces` as they stand: a piece already on
  // its square keeps its entry (and shared values), anything else gets a
  // fresh one placed straight there.
  function placeAll() {
    const idBySquare = new Map<Square, string>();
    const entries = new Map<string, AnimatedPieceView>();
    pieces.forEach((piece) => {
      const pieceId = pieceIdBySquare.current.get(piece.square);
      const existing = pieceId && entryById.current.get(pieceId);
      const pieceEntry =
        existing && existing.spriteId === `${piece.color}${piece.type}`
          ? existing
          : createEntry(piece);
      idBySquare.set(piece.square, pieceEntry.id);
      entries.set(pieceEntry.id, pieceEntry);
    });
    pieceIdBySquare.current = idBySquare;
    entryById.current = entries;
    movedIds.current = new Set();
    capturedViews.current = [];
  }

  if (!initialized.current) {
    initialized.current = true;
    placeAll();
  } else if (lastMove && lastMove !== processedMove.current) {
    processedMove.current = lastMove;
    moveCount.current += 1;
    pendingAnimations.current = applyMove(lastMove);
  } else if (pieces !== prevPieces.current) {
    // A new position with no move to get there - a refused move taken
    // back - so the pieces are put straight on their squares.
    processedMove.current = lastMove;
    moveCount.current += 1;
    placeAll();
  }

  // A layout effect, so the move is already under way in the first frame
  // that shows its new position.
  useLayoutEffect(() => {
    const animations = pendingAnimations.current;
    pendingAnimations.current = [];
    if (animations.length === 0) return;

    const move = moveCount.current;
    let travelling = animations.length;
    // Landed (or cut short by a drag or a newer move): the piece it took
    // goes now - unless a newer move has its own captured piece showing.
    const onLanded = () => {
      travelling -= 1;
      if (
        travelling === 0 &&
        move === moveCount.current &&
        capturedViews.current.length > 0
      ) {
        capturedViews.current = [];
        setLandings((count) => count + 1);
      }
    };
    animations.forEach(({ pieceEntry, toSquare }) => {
      springPieceTo(
        pieceEntry,
        getXYFromSquare(toSquare, pieceWidth, orientation),
        MOVE_SPRING,
        onLanded,
      );
    });
  }, [lastMove, pieceWidth, orientation]);

  // A pawn waiting on the promotion menu stands on the square it's
  // promoting on - where it was dropped, or where it was tapped to - and
  // goes back if the promotion is called off. Once it's played, the move
  // above picks it up from there.
  useLayoutEffect(() => {
    const previous = prevPendingPromotion.current;
    prevPendingPromotion.current = pendingPromotion;
    const promotion = pendingPromotion ?? previous;
    if (!promotion) return;
    const pieceId = pieceIdBySquare.current.get(promotion.from);
    const pawn = pieceId && entryById.current.get(pieceId);
    // Already gone from `from`: the promotion was played.
    if (!pawn) return;
    springPieceTo(
      pawn,
      getXYFromSquare(
        pendingPromotion ? promotion.to : promotion.from,
        pieceWidth,
        orientation,
      ),
      MOVE_SPRING,
    );
  }, [pendingPromotion, pieceWidth, orientation]);

  // Flipping the board moves every piece to its mirrored square at once.
  // A layout effect (not a plain one) so the old layout is never painted
  // for a frame after the flip. The square-keyed bookkeeping above is
  // orientation-independent, so only the on-screen positions change.
  useLayoutEffect(() => {
    if (prevOrientation.current === orientation) return;
    prevOrientation.current = orientation;
    [...entryById.current.values(), ...capturedViews.current].forEach(
      (pieceEntry) => {
        const position = getXYFromSquare(
          pieceEntry.square,
          pieceWidth,
          orientation,
        );
        pieceEntry.x.set(position.x);
        pieceEntry.y.set(position.y);
      },
    );
  }, [orientation, pieceWidth]);

  if (
    pieces !== prevPieces.current ||
    capturedViews.current !== prevCapturedViews.current ||
    pendingPromotion !== prevOrderedPromotion.current
  ) {
    prevPieces.current = pieces;
    prevCapturedViews.current = capturedViews.current;
    prevOrderedPromotion.current = pendingPromotion;
    const views = pieces.map((piece) => {
      const pieceId = pieceIdBySquare.current.get(piece.square);
      const pieceEntry = pieceId ? entryById.current.get(pieceId) : undefined;
      if (!pieceEntry) {
        // Should be unreachable if the bookkeeping above stayed in sync with
        // the domain snapshot - fall back to a fresh, unanimated view rather
        // than crash.
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
    if (pendingPromotion) {
      onTop.add(pieceIdBySquare.current.get(pendingPromotion.from));
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
