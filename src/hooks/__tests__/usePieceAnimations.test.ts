import { renderHook } from '@testing-library/react-native';

import { usePieceAnimations } from '../usePieceAnimations';
import { AppliedMove, DomainPiece } from '../../domain/types';
import { getXYFromSquare } from '../../domain/boardCoordinates';
import { getAnimatedXY } from '../../testUtils/animatedValue';

describe('usePieceAnimations', () => {
  const pieceWidth = 50;
  const twoPieces: DomainPiece[] = [
    { square: 'e2', type: 'p', color: 'w' },
    { square: 'e7', type: 'p', color: 'b' },
  ];

  it('returns the same array reference across re-renders when `pieces` itself is unchanged', async () => {
    // Regression guard for the fix to the drag-guide hide delay: useChessGame
    // only ever produces a new `pieces` array on an actually-applied move, so
    // a re-render triggered by anything else (e.g. selecting a square) should
    // be able to reuse this hook's previous return value exactly - a fresh
    // array here, even with identical contents, would give Piece's
    // React.memo nothing to bail out on, forcing every piece to re-render.
    const { result, rerender } = await renderHook(
      (props: { pieces: DomainPiece[] }) =>
        usePieceAnimations(props.pieces, null, pieceWidth),
      { initialProps: { pieces: twoPieces } },
    );

    const firstResult = result.current;
    await rerender({ pieces: twoPieces });

    expect(result.current).toBe(firstResult);
  });

  it('returns a new array when `pieces` is a genuinely new reference', async () => {
    const { result, rerender } = await renderHook(
      (props: { pieces: DomainPiece[] }) =>
        usePieceAnimations(props.pieces, null, pieceWidth),
      { initialProps: { pieces: twoPieces } },
    );

    const firstResult = result.current;
    const newPieces = [...twoPieces];
    await rerender({ pieces: newPieces });

    expect(result.current).not.toBe(firstResult);
    // Same pieces, so the same underlying per-piece entries should still
    // come back (identity by square is preserved), just in a fresh array.
    expect(result.current).toEqual(firstResult);
  });

  it("keeps each individual piece's view referentially stable across an unrelated re-render", async () => {
    const { result, rerender } = await renderHook(
      (props: { pieces: DomainPiece[] }) =>
        usePieceAnimations(props.pieces, null, pieceWidth),
      { initialProps: { pieces: twoPieces } },
    );

    const firstPieceView = result.current[0];
    await rerender({ pieces: [...twoPieces] });

    // The array wrapper may be new (previous test), but each piece's own
    // AnimatedPieceView - and crucially its Animated.Value objects - must be
    // the exact same object, or animations would silently stop working.
    expect(result.current[0]).toBe(firstPieceView);
  });

  it('moves every piece to its mirrored position when the orientation flips, keeping the same Animated values', async () => {
    const { result, rerender } = await renderHook(
      (props: { orientation: 'w' | 'b' }) =>
        usePieceAnimations(twoPieces, null, pieceWidth, props.orientation),
      { initialProps: { orientation: 'w' as 'w' | 'b' } },
    );
    const e2View = result.current[0];

    await rerender({ orientation: 'b' });

    expect(result.current[0]).toBe(e2View);
    expect(getAnimatedXY(e2View.animatedPosition)).toEqual(
      getXYFromSquare('e2', pieceWidth, 'b'),
    );
    expect(getAnimatedXY(result.current[1].animatedPosition)).toEqual(
      getXYFromSquare('e7', pieceWidth, 'b'),
    );
  });
  it('puts pieces straight on their squares for a position reached without a move', async () => {
    const e2e4: AppliedMove = {
      from: 'e2',
      to: 'e4',
      piece: 'p',
      color: 'w',
      isCapture: false,
      isEnPassant: false,
      isKingSideCastle: false,
      isQueenSideCastle: false,
      isPromotion: false,
    };
    const afterE4: DomainPiece[] = [
      { square: 'e4', type: 'p', color: 'w' },
      { square: 'e7', type: 'p', color: 'b' },
    ];
    const { result, rerender } = await renderHook(
      (props: { pieces: DomainPiece[]; lastMove: AppliedMove | null }) =>
        usePieceAnimations(props.pieces, props.lastMove, pieceWidth),
      { initialProps: { pieces: twoPieces, lastMove: null } },
    );
    const e7View = result.current[1];
    await rerender({ pieces: afterE4, lastMove: e2e4 });

    // The move taken back: the old position, with no move to animate.
    await rerender({ pieces: [...twoPieces], lastMove: null });

    expect(result.current.map((view) => view.square)).toEqual(['e2', 'e7']);
    expect(getAnimatedXY(result.current[0].animatedPosition)).toEqual(
      getXYFromSquare('e2', pieceWidth),
    );
    expect(result.current[1]).toBe(e7View);
  });
});
