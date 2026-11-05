import { renderHook } from '@testing-library/react-native';

import {
  PieceTrackerInput,
  TrackedPiece,
  usePieceTracker,
} from '../usePieceTracker';
import { getXYFromSquare } from '../../coordinates';
import { parsePlacement } from '../../fen';
import { BoardPiece, MoveSquares, Square } from '../../types';
import { settleAnimations } from '../../../../testUtils/pieceGestures';

const pieceWidth = 50;

type Props = Omit<PieceTrackerInput, 'lastMove' | 'squareSize'> & {
  lastMove?: MoveSquares | null;
  squareSize?: number;
};

// The hook, re-rendered with new props as a board would be.
function renderTracker(initialProps: Props) {
  return renderHook(
    ({ lastMove = null, squareSize = pieceWidth, ...props }: Props) =>
      usePieceTracker({ lastMove, squareSize, ...props }),
    { initialProps },
  );
}

function positionOf(view: TrackedPiece) {
  return { x: view.x.get(), y: view.y.get() };
}

function isOn(view: TrackedPiece, square: Square) {
  const target = getXYFromSquare(square, pieceWidth);
  return view.x.get() === target.x && view.y.get() === target.y;
}

function on(result: { current: TrackedPiece[] }, square: Square) {
  return result.current.find(
    (view) => view.square === square && !view.captured,
  );
}

describe('usePieceTracker', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const twoPieces: BoardPiece[] = [
    { square: 'e2', type: 'p', color: 'w' },
    { square: 'e7', type: 'p', color: 'b' },
  ];
  const afterE4: BoardPiece[] = [
    { square: 'e4', type: 'p', color: 'w' },
    { square: 'e7', type: 'p', color: 'b' },
  ];
  const e2e4: MoveSquares = { from: 'e2', to: 'e4' };

  it('returns the same array reference across re-renders when `pieces` itself is unchanged', async () => {
    // A board only produces a new `pieces` array for a new position, so a
    // re-render triggered by anything else (e.g. selecting a square) should
    // reuse this hook's previous return value exactly - a fresh array here,
    // even with identical contents, would give Piece's React.memo nothing to
    // bail out on, forcing every piece to re-render.
    const { result, rerender } = await renderTracker({ pieces: twoPieces });

    const firstResult = result.current;
    await rerender({ pieces: twoPieces });

    expect(result.current).toBe(firstResult);
  });

  it('returns a new array when `pieces` is a genuinely new reference', async () => {
    const { result, rerender } = await renderTracker({ pieces: twoPieces });

    const firstResult = result.current;
    await rerender({ pieces: [...twoPieces] });

    expect(result.current).not.toBe(firstResult);
    // Same pieces, so the same underlying per-piece entries should still
    // come back, just in a fresh array.
    expect(result.current).toEqual(firstResult);
  });

  it("keeps each individual piece's view referentially stable across an unrelated re-render", async () => {
    const { result, rerender } = await renderTracker({ pieces: twoPieces });

    const firstPieceView = result.current[0];
    await rerender({ pieces: [...twoPieces] });

    // Each piece's own view - and crucially its shared values - must be the
    // exact same object, or animations would silently stop working.
    expect(result.current[0]).toBe(firstPieceView);
  });

  it('puts every piece on its square at a new size when the board is resized', async () => {
    const { result, rerender } = await renderTracker({ pieces: twoPieces });

    await rerender({ pieces: twoPieces, squareSize: 40 });

    const e7 = result.current.find((view) => view.square === 'e7');
    expect(positionOf(e7)).toEqual(getXYFromSquare('e7', 40));
  });

  it('slides the piece of a move played to its new square', async () => {
    const { result, rerender } = await renderTracker({ pieces: twoPieces });
    const pawn = result.current[0];

    await rerender({ pieces: afterE4, lastMove: e2e4 });

    expect(on(result, 'e4')).toBe(pawn);
    expect(positionOf(pawn)).toEqual(getXYFromSquare('e2', pieceWidth));
    await settleAnimations();
    expect(positionOf(pawn)).toEqual(getXYFromSquare('e4', pieceWidth));
  });

  it('puts pieces straight on their squares for a position reached without a move', async () => {
    const { result, rerender } = await renderTracker({ pieces: twoPieces });
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

  it("doesn't take a new position for a move whose piece never left its square - an earlier move marked again, as on a move refused", async () => {
    const afterE5 = parsePlacement('8/8/8/4p3/4P3/8/8/8');
    const afterE5Nf3 = parsePlacement('8/8/8/4p3/4P3/5N2/8/8');
    const { result, rerender } = await renderTracker({
      pieces: afterE5,
      lastMove: { from: 'e7', to: 'e5' },
    });

    // Nf3 played, then refused: back to the position after ...e5, marking
    // ...e5 again - its pawn didn't just leave e7.
    await rerender({ pieces: afterE5Nf3, lastMove: { from: 'g1', to: 'f3' } });
    await settleAnimations();
    await rerender({ pieces: afterE5, lastMove: { from: 'e7', to: 'e5' } });

    expect(result.current.map((view) => view.square)).toEqual(['e5', 'e4']);
    expect(result.current.some((view) => view.captured)).toBe(false);
  });

  it('slides both the king and the rook of a castle, marked king to rook', async () => {
    const before = parsePlacement('4k3/8/8/8/8/8/8/4K2R');
    const after = parsePlacement('4k3/8/8/8/8/8/8/5RK1');
    const { result, rerender } = await renderTracker({ pieces: before });
    const king = on(result, 'e1');
    const rook = on(result, 'h1');

    await rerender({ pieces: after, lastMove: { from: 'e1', to: 'h1' } });
    await settleAnimations();

    expect(on(result, 'g1')).toBe(king);
    expect(on(result, 'f1')).toBe(rook);
    expect(positionOf(king)).toEqual(getXYFromSquare('g1', pieceWidth));
    expect(positionOf(rook)).toEqual(getXYFromSquare('f1', pieceWidth));
  });

  it('turns a pawn into the piece it promotes to', async () => {
    const before = parsePlacement('8/4P3/8/8/8/8/8/8');
    const after = parsePlacement('4Q3/8/8/8/8/8/8/8');
    const { result, rerender } = await renderTracker({ pieces: before });
    const pawn = result.current[0];

    await rerender({ pieces: after, lastMove: { from: 'e7', to: 'e8' } });

    expect(result.current).toEqual([
      expect.objectContaining({ id: pawn.id, spriteId: 'wq', square: 'e8' }),
    ]);
  });

  describe('sliding into a position reached without a move', () => {
    const afterE4xd5: BoardPiece[] = [
      { square: 'd5', type: 'p', color: 'w' },
      { square: 'e7', type: 'p', color: 'b' },
    ];
    const beforeIt: BoardPiece[] = [
      { square: 'e4', type: 'p', color: 'w' },
      { square: 'd5', type: 'p', color: 'b' },
      { square: 'e7', type: 'p', color: 'b' },
    ];

    async function stepBack(onSettled = jest.fn()) {
      const { result, rerender } = await renderTracker({
        pieces: afterE4xd5,
        slideOnSet: true,
        onSettled,
      });
      const capturer = result.current[0];
      onSettled.mockClear();
      await rerender({ pieces: beforeIt, slideOnSet: true, onSettled });
      return { result, capturer };
    }

    it('keeps the piece that moved, sliding it back from where it stood', async () => {
      const { result, capturer } = await stepBack();

      const pawn = result.current.find((view) => view.square === 'e4');
      expect(pawn).toBe(capturer);
      expect(positionOf(capturer)).toEqual(getXYFromSquare('d5', pieceWidth));

      await settleAnimations();
      expect(positionOf(capturer)).toEqual(getXYFromSquare('e4', pieceWidth));
    });

    it('puts a piece taken back straight on its square', async () => {
      const { result } = await stepBack();

      const taken = result.current.find(
        (view) => view.square === 'd5' && view.spriteId === 'bp',
      );
      expect(taken && positionOf(taken)).toEqual(
        getXYFromSquare('d5', pieceWidth),
      );
    });

    it('says when the pieces are all there', async () => {
      const onSettled = jest.fn();
      await stepBack(onSettled);
      expect(onSettled).not.toHaveBeenCalled();

      await settleAnimations();

      expect(onSettled).toHaveBeenCalledTimes(1);
    });
  });

  it('says the pieces are there at once when nothing slides', async () => {
    const onSettled = jest.fn();
    const { rerender } = await renderTracker({ pieces: twoPieces, onSettled });
    expect(onSettled).toHaveBeenCalledTimes(1);

    await rerender({
      pieces: afterE4,
      lastMove: e2e4,
      onSettled,
      animate: false,
    });

    expect(onSettled).toHaveBeenCalledTimes(2);
  });

  describe('a capture', () => {
    // exd5 (and then ...cxd5), on a board with just the pawns and kings.
    const before: BoardPiece[] = [
      { square: 'e1', type: 'k', color: 'w' },
      { square: 'e4', type: 'p', color: 'w' },
      { square: 'c6', type: 'p', color: 'b' },
      { square: 'd5', type: 'p', color: 'b' },
      { square: 'e8', type: 'k', color: 'b' },
    ];
    const after: BoardPiece[] = [
      { square: 'e1', type: 'k', color: 'w' },
      { square: 'd5', type: 'p', color: 'w' },
      { square: 'c6', type: 'p', color: 'b' },
      { square: 'e8', type: 'k', color: 'b' },
    ];
    const exd5: MoveSquares = { from: 'e4', to: 'd5' };

    async function renderCapture() {
      const hook = await renderTracker({ pieces: before });
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

    it('shows the pawn an en passant capture takes, off the square moved to', async () => {
      const beforeEp = parsePlacement('8/8/8/3pP3/8/8/8/8');
      const afterEp = parsePlacement('8/8/3P4/8/8/8/8/8');
      const { result, rerender } = await renderTracker({ pieces: beforeEp });

      await rerender({ pieces: afterEp, lastMove: { from: 'e5', to: 'd6' } });

      expect(result.current.find((view) => view.captured)).toMatchObject({
        spriteId: 'bp',
        square: 'd5',
      });
      await settleAnimations();
      expect(result.current.some((view) => view.captured)).toBe(false);
    });

    it('puts the piece taking it straight on its square, and the piece taken straight off, without animations', async () => {
      const { result, rerender } = await renderTracker({
        pieces: before,
        animate: false,
      });
      const moverView = result.current[1];

      await rerender({ pieces: after, lastMove: exd5, animate: false });

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
        lastMove: { from: 'c6', to: 'd5' },
      });
      const recapturer = on(result, 'd5');

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
    const pieces: BoardPiece[] = [
      { square: 'e1', type: 'k', color: 'w' },
      { square: 'e7', type: 'p', color: 'w' },
      { square: 'a8', type: 'k', color: 'b' },
    ];
    const promotion: MoveSquares = { from: 'e7', to: 'e8' };

    async function renderPromotion() {
      const hook = await renderTracker({ pieces, promotion: null });
      const pawn = hook.result.current[1];
      await hook.rerender({ pieces, promotion });
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

      await rerender({ pieces, promotion: null });
      await settleAnimations();

      expect(positionOf(pawn)).toEqual(getXYFromSquare('e7', pieceWidth));
    });
  });
});
