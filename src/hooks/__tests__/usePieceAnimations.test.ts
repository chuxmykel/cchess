import { renderHook } from '@testing-library/react-native';
import { Square } from 'chess.js';

import { AnimatedPieceView, usePieceAnimations } from '../usePieceAnimations';
import { AppliedMove, DomainPiece } from '../../domain/types';
import { getXYFromSquare } from '../../domain/boardCoordinates';
import { settleAnimations } from '../../testUtils/pieceGestures';

describe('usePieceAnimations', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function positionOf(view: AnimatedPieceView) {
    return { x: view.x.get(), y: view.y.get() };
  }

  function isOn(view: AnimatedPieceView, square: Square) {
    const target = getXYFromSquare(square, pieceWidth);
    return view.x.get() === target.x && view.y.get() === target.y;
  }

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
    // AnimatedPieceView - and crucially its shared values - must be
    // the exact same object, or animations would silently stop working.
    expect(result.current[0]).toBe(firstPieceView);
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
      san: 'e4',
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
    expect(positionOf(result.current[0])).toEqual(
      getXYFromSquare('e2', pieceWidth),
    );
    expect(result.current[1]).toBe(e7View);
  });

  describe('a capture', () => {
    // exd5 (and then ...cxd5), on a board with just the pawns and kings.
    const before: DomainPiece[] = [
      { square: 'e1', type: 'k', color: 'w' },
      { square: 'e4', type: 'p', color: 'w' },
      { square: 'c6', type: 'p', color: 'b' },
      { square: 'd5', type: 'p', color: 'b' },
      { square: 'e8', type: 'k', color: 'b' },
    ];
    const after: DomainPiece[] = [
      { square: 'e1', type: 'k', color: 'w' },
      { square: 'd5', type: 'p', color: 'w' },
      { square: 'c6', type: 'p', color: 'b' },
      { square: 'e8', type: 'k', color: 'b' },
    ];
    const exd5: AppliedMove = {
      from: 'e4',
      to: 'd5',
      piece: 'p',
      color: 'w',
      isCapture: true,
      capturedSquare: 'd5',
      isEnPassant: false,
      isKingSideCastle: false,
      isQueenSideCastle: false,
      isPromotion: false,
      san: 'exd5',
    };

    async function renderCapture() {
      const hook = await renderHook(
        (props: { pieces: DomainPiece[]; lastMove: AppliedMove | null }) =>
          usePieceAnimations(props.pieces, props.lastMove, pieceWidth),
        { initialProps: { pieces: before, lastMove: null } },
      );
      const takenView = hook.result.current[3];
      const moverView = hook.result.current[1];
      await hook.rerender({ pieces: after, lastMove: exd5 });
      return { ...hook, takenView, moverView };
    }

    it('still shows the piece taken while the piece taking it is on its way', async () => {
      const { result, takenView } = await renderCapture();

      const taken = result.current.find((view) => view.captured);
      expect(taken).toMatchObject({ id: takenView.id, square: 'd5' });
      // Drawn first - under everything else.
      expect(result.current[0]).toBe(taken);
    });

    it('draws the piece taking it last, over everything else', async () => {
      const { result, moverView } = await renderCapture();

      expect(result.current[result.current.length - 1]).toBe(moverView);
    });

    it('moves the piece taking it to its new square, rather than jumping', async () => {
      const { moverView } = await renderCapture();
      const e4 = getXYFromSquare('e4', pieceWidth);
      const d5 = getXYFromSquare('d5', pieceWidth);

      await settleAnimations(25);
      const midway = positionOf(moverView);
      expect(midway.x).toBeLessThan(e4.x);
      expect(midway.x).toBeGreaterThan(d5.x);

      await settleAnimations();
      expect(positionOf(moverView)).toEqual(d5);
    });

    it('removes the piece taken once the piece taking it lands', async () => {
      const { result, moverView } = await renderCapture();

      await settleAnimations();

      expect(result.current.some((view) => view.captured)).toBe(false);
      expect(result.current.map((view) => view.square)).toEqual([
        'e1',
        'c6',
        'e8',
        'd5',
      ]);
      expect(positionOf(moverView)).toEqual(getXYFromSquare('d5', pieceWidth));
    });

    it('puts the piece taking it straight on its square, and the piece taken straight off, without animations', async () => {
      const { result, rerender } = await renderHook(
        (props: { pieces: DomainPiece[]; lastMove: AppliedMove | null }) =>
          usePieceAnimations(
            props.pieces,
            props.lastMove,
            pieceWidth,
            null,
            false,
          ),
        { initialProps: { pieces: before, lastMove: null } },
      );
      const moverView = result.current[1];

      await rerender({ pieces: after, lastMove: exd5 });

      expect(positionOf(moverView)).toEqual(getXYFromSquare('d5', pieceWidth));
      expect(result.current.some((view) => view.captured)).toBe(false);
    });

    it("doesn't let an earlier move's landing remove a later capture's piece", async () => {
      const { result, rerender, moverView } = await renderCapture();
      // ...cxd5, while exd5 is still on its way.
      await settleAnimations(16);
      await rerender({
        pieces: [
          { square: 'e1', type: 'k', color: 'w' },
          { square: 'd5', type: 'p', color: 'b' },
          { square: 'e8', type: 'k', color: 'b' },
        ],
        lastMove: { ...exd5, from: 'c6', color: 'b' },
      });
      const recapturer = result.current.find(
        (view) => view.square === 'd5' && !view.captured,
      );

      // The moment exd5 has landed and ...cxd5 hasn't, exd5's pawn - now
      // the one taken - is still there.
      let sawBetween = false;
      for (let elapsed = 0; elapsed < 2000 && !sawBetween; elapsed += 16) {
        await settleAnimations(16);
        const exd5Landed = isOn(moverView, 'd5');
        const cxd5Landed = isOn(recapturer, 'd5');
        if (exd5Landed && !cxd5Landed) {
          sawBetween = true;
          const taken = result.current.filter((view) => view.captured);
          expect(taken.map((view) => view.id)).toEqual([moverView.id]);
        }
      }
      expect(sawBetween).toBe(true);

      await settleAnimations();
      expect(result.current.some((view) => view.captured)).toBe(false);
    });
  });

  describe('a pawn waiting on the promotion menu', () => {
    const pieces: DomainPiece[] = [
      { square: 'e1', type: 'k', color: 'w' },
      { square: 'e7', type: 'p', color: 'w' },
      { square: 'a8', type: 'k', color: 'b' },
    ];
    const promotion = { from: 'e7' as Square, to: 'e8' as Square };

    async function renderPromotion() {
      const hook = await renderHook(
        (props: { pendingPromotion: typeof promotion | null }) =>
          usePieceAnimations(pieces, null, pieceWidth, props.pendingPromotion),
        { initialProps: { pendingPromotion: null } },
      );
      const pawn = hook.result.current[1];
      await hook.rerender({ pendingPromotion: promotion });
      return { ...hook, pawn };
    }

    it('stands on the square it promotes on, over the other pieces', async () => {
      const { result, pawn } = await renderPromotion();

      await settleAnimations();

      expect(positionOf(pawn)).toEqual(getXYFromSquare('e8', pieceWidth));
      expect(result.current[result.current.length - 1]).toBe(pawn);
    });

    it('goes back to its square when the promotion is called off', async () => {
      const { rerender, pawn } = await renderPromotion();
      await settleAnimations();

      await rerender({ pendingPromotion: null });
      await settleAnimations();

      expect(positionOf(pawn)).toEqual(getXYFromSquare('e7', pieceWidth));
    });
  });
});
