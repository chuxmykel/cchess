import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Color, PieceSymbol, Square } from 'chess.js';

import { AppliedMove, DomainPiece } from '../domain/types';
import { getXYFromSquare } from '../domain/boardCoordinates';
import { generatePieceId } from '../utils/animation';

const ANIMATION_DURATION = 50;

type SpriteId = `${Color}${PieceSymbol}`;

// The RN-aware view of a piece: a stable identity plus the Animated objects
// that drive its on-screen position/opacity. Mirrors a DomainPiece 1:1, but
// only pieces still on the board ever appear here.
export type AnimatedPieceView = {
  id: string;
  spriteId: SpriteId;
  square: Square;
  animatedPosition: Animated.ValueXY;
  opacity: Animated.Value;
};

type PieceEntry = {
  id: string;
  square: Square;
  spriteId: SpriteId;
  animatedPosition: Animated.ValueXY;
  opacity: Animated.Value;
};

export function usePieceAnimations(
  pieces: DomainPiece[],
  lastMove: AppliedMove | null,
  pieceWidth: number,
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
  const entryById = useRef(new Map<string, PieceEntry>());
  const initialized = useRef(false);
  const processedMove = useRef<AppliedMove | null>(null);
  const pendingAnimations = useRef<
    { pieceEntry: PieceEntry; toSquare: Square }[]
  >([]);
  const prevPieces = useRef<DomainPiece[] | null>(null);
  const prevResult = useRef<AnimatedPieceView[]>([]);

  function createEntry(piece: DomainPiece): PieceEntry {
    return {
      id: generatePieceId(piece.color, piece.type, piece.square),
      square: piece.square,
      spriteId: `${piece.color}${piece.type}`,
      animatedPosition: new Animated.ValueXY(
        getXYFromSquare(piece.square, pieceWidth),
      ),
      opacity: new Animated.Value(1),
    };
  }

  function movePiece(
    from: Square,
    to: Square,
    animations: { pieceEntry: PieceEntry; toSquare: Square }[],
  ) {
    const pieceId = pieceIdBySquare.current.get(from);
    const pieceEntry = pieceId && entryById.current.get(pieceId);
    if (!pieceId || !pieceEntry) return;
    pieceIdBySquare.current.delete(from);
    pieceIdBySquare.current.set(to, pieceId);
    pieceEntry.square = to;
    animations.push({ pieceEntry, toSquare: to });
  }

  function removePiece(square: Square) {
    const pieceId = pieceIdBySquare.current.get(square);
    if (!pieceId) return;
    pieceIdBySquare.current.delete(square);
    entryById.current.delete(pieceId);
  }

  function applyMove(
    move: AppliedMove,
  ): { pieceEntry: PieceEntry; toSquare: Square }[] {
    const animations: { pieceEntry: PieceEntry; toSquare: Square }[] = [];

    if (move.isCapture && move.capturedSquare) {
      removePiece(move.capturedSquare);
    }
    if (move.rookFrom && move.rookTo) {
      movePiece(move.rookFrom, move.rookTo, animations);
    }
    movePiece(move.from, move.to, animations);

    if (move.isPromotion && move.promotionPiece) {
      const pieceId = pieceIdBySquare.current.get(move.to);
      const pieceEntry = pieceId && entryById.current.get(pieceId);
      if (pieceEntry) {
        pieceEntry.spriteId = `${move.color}${move.promotionPiece}`;
      }
    }

    return animations;
  }

  if (!initialized.current) {
    initialized.current = true;
    pieces.forEach((piece) => {
      const pieceEntry = createEntry(piece);
      pieceIdBySquare.current.set(piece.square, pieceEntry.id);
      entryById.current.set(pieceEntry.id, pieceEntry);
    });
  } else if (lastMove && lastMove !== processedMove.current) {
    processedMove.current = lastMove;
    pendingAnimations.current = applyMove(lastMove);
  }

  useEffect(() => {
    pendingAnimations.current.forEach(({ pieceEntry, toSquare }) => {
      Animated.timing(pieceEntry.animatedPosition, {
        toValue: getXYFromSquare(toSquare, pieceWidth),
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start();
    });
    pendingAnimations.current = [];
  }, [lastMove, pieceWidth]);

  if (pieces !== prevPieces.current) {
    prevPieces.current = pieces;
    prevResult.current = pieces.map((piece) => {
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
  }
  return prevResult.current;
  /* eslint-enable react-hooks/refs */
}
