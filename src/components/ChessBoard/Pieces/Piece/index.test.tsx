import { render } from '@testing-library/react-native';
import { Color, Square } from 'chess.js';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { makeMutable } from 'react-native-reanimated';

import Piece from '.';
import { LegalTargets } from '../../../../domain/types';
import { getXYFromSquare } from '../../../../domain/boardCoordinates';
import { DRAG_LIFT, DRAG_SCALE } from '../../../../constants/animations';
import { TakenByDrop } from '../../../../hooks/useDragGuide';
import {
  dragPiece,
  dragPieceThenCancelled,
  dragThenMoveOnLift,
  flickPiece,
  holdDrag,
  settleAnimations,
  tapPiece,
  touchPiece,
} from '../../../../testUtils/pieceGestures';
import { animatedStyleOf } from '../../../../testUtils/animatedValue';

describe('Piece', () => {
  const width = 50;
  const home = getXYFromSquare('e2', width);

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  async function renderPiece(
    overrides: Partial<{
      id: string;
      square: Square;
      orientation: Color;
      taken: TakenByDrop;
      disabled: boolean;
      captured: boolean;
      legalTargets: LegalTargets;
    }> = {},
  ) {
    const onTap = jest.fn();
    const onDragRelease = jest.fn();
    const onDragStart = jest.fn();
    const square = overrides.square ?? 'e2';
    // Placed from white's side, whichever way the board faces.
    const position = getXYFromSquare(square, width);
    const x = makeMutable(position.x);
    const y = makeMutable(position.y);
    const dragGuide = {
      x: makeMutable(0),
      y: makeMutable(0),
      opacity: makeMutable(0),
      origin: makeMutable<{ x: number; y: number } | null>(null),
      taken: makeMutable<TakenByDrop | null>(overrides.taken ?? null),
    };
    const captured = overrides.captured ?? false;
    const screen = await render(
      <GestureHandlerRootView>
        <Piece
          id={overrides.id ?? 'wp'}
          square={square}
          width={width}
          orientation={overrides.orientation ?? 'w'}
          x={x}
          y={y}
          disabled={overrides.disabled ?? false}
          captured={captured}
          legalTargets={makeMutable(
            overrides.legalTargets ?? { e2: ['e3', 'e4'] },
          )}
          dragGuide={dragGuide}
          onTap={onTap}
          onDragRelease={onDragRelease}
          onDragStart={onDragStart}
        />
      </GestureHandlerRootView>,
    );
    const testID = `${captured ? 'taken-piece' : 'piece'}-${square}`;
    return {
      piece: screen.getByTestId(testID),
      testID,
      x,
      y,
      dragGuide,
      onTap,
      onDragRelease,
      onDragStart,
    };
  }

  it('should exist', () => {
    expect(Piece).toBeDefined();
  });

  it('is drawn where its shared values place it', async () => {
    const { piece } = await renderPiece();

    expect(animatedStyleOf(piece)).toMatchObject({
      transform: [{ translateX: home.x }, { translateY: home.y }, { scale: 1 }],
    });
  });

  it("reports the piece's from/to squares when dragged and dropped", async () => {
    const { testID, onDragRelease } = await renderPiece();

    // Up two squares.
    await dragPiece(testID, 0, -100);

    expect(onDragRelease).toHaveBeenCalledWith('e2', 'e4');
  });

  it('reports onDragStart on touch-down', async () => {
    const { testID, onDragStart, onTap } = await renderPiece();

    await touchPiece(testID);

    expect(onDragStart).toHaveBeenCalledWith('e2');
    expect(onTap).not.toHaveBeenCalled();
  });

  it("doesn't report onDragStart for a disabled (opponent's) piece", async () => {
    const { testID, onDragStart } = await renderPiece({ disabled: true });

    await dragPiece(testID, 0, -100);

    expect(onDragStart).not.toHaveBeenCalled();
  });

  it('reports a tap, and no drop, for a touch that never became a drag', async () => {
    const { testID, onDragRelease, onTap } = await renderPiece();

    await tapPiece(testID);

    expect(onTap).toHaveBeenCalledWith('e2');
    expect(onDragRelease).not.toHaveBeenCalled();
  });

  it("still reports a tap on a disabled (opponent's) piece, so it can be a move's target", async () => {
    const { testID, onTap } = await renderPiece({ disabled: true });

    await tapPiece(testID);

    expect(onTap).toHaveBeenCalledWith('e2');
  });

  it("still reports a drag's outcome for a disabled (opponent's) piece - legality is the caller's call", async () => {
    const { testID, onDragRelease, x, y } = await renderPiece({
      disabled: true,
    });

    await dragPiece(testID, 0, -100);

    expect(onDragRelease).toHaveBeenCalledWith('e2', 'e4');
    // But it never moved.
    expect({ x: x.get(), y: y.get() }).toEqual(home);
  });

  it('follows the finger, a square above it, over the other pieces', async () => {
    const { piece, testID } = await renderPiece();

    await holdDrag(testID, 30, -80);

    expect(animatedStyleOf(piece)).toMatchObject({
      transform: [
        { translateX: home.x + 30 },
        { translateY: home.y - 80 - width * DRAG_LIFT },
        { scale: expect.any(Number) },
      ],
      zIndex: 100,
    });
  });

  it('grows to its dragging size while held', async () => {
    const { piece, testID } = await renderPiece();

    await holdDrag(testID, 0, -80);
    await settleAnimations();

    expect(animatedStyleOf(piece).transform[2]).toEqual({
      scale: DRAG_SCALE,
    });
  });

  it('marks the square under the finger with the drag guide while dragging', async () => {
    const { testID, dragGuide } = await renderPiece();

    // Over e4, a little off its corner.
    await holdDrag(testID, 10, -90);

    expect(dragGuide.opacity.get()).toBe(1);
    expect({ x: dragGuide.x.get(), y: dragGuide.y.get() }).toEqual(
      getXYFromSquare('e4', width),
    );
  });

  it("marks the piece's own square while it's held, and not once let go", async () => {
    const { testID, dragGuide } = await renderPiece();

    await holdDrag(testID, 0, -80);
    expect(dragGuide.origin.get()).toEqual(home);

    await dragPiece(testID, 0, -100);
    expect(dragGuide.origin.get()).toBeNull();
  });

  it('hides the drag guide off the board, and on release', async () => {
    const { testID, dragGuide } = await renderPiece();

    await holdDrag(testID, 400, 0);
    expect(dragGuide.opacity.get()).toBe(0);

    await dragPiece(testID, 0, -100);
    expect(dragGuide.opacity.get()).toBe(0);
  });

  it('lands on the square it was dropped on when that is a legal move', async () => {
    const { piece, testID } = await renderPiece();

    await dragPiece(testID, 10, -90);

    const e4 = getXYFromSquare('e4', width);
    expect(animatedStyleOf(piece)).toMatchObject({
      transform: [{ translateX: e4.x }, { translateY: e4.y }, { scale: 1 }],
      // Still over the rest until the game makes the move (see
      // usePieceGesture).
      zIndex: 100,
    });
  });

  it('drops on the square under the finger, wherever it grabbed the piece', async () => {
    const { testID, onDragRelease } = await renderPiece();

    // Grabbed by its bottom edge, then up 70 points: the finger ends inside
    // e3. Judged from the piece's middle instead, it would be over e4.
    await dragPiece(testID, 0, -70, { x: 25, y: 48 });

    expect(onDragRelease).toHaveBeenCalledWith('e2', 'e3');
  });

  it('marks the piece a drop takes, the moment it lands', async () => {
    const { testID, dragGuide } = await renderPiece();

    await dragPiece(testID, 0, -100);

    expect(dragGuide.taken.get()).toEqual({
      from: 'e2',
      to: 'e4',
      color: 'b',
    });
  });

  it('disappears when a drop takes it', async () => {
    const { piece } = await renderPiece({
      id: 'bp',
      square: 'e4',
      taken: { from: 'd3', to: 'e4', color: 'b' },
    });

    expect(animatedStyleOf(piece).opacity).toBe(0);
  });

  it("stays when a drop lands on its square but it's the piece dropped", async () => {
    const { piece } = await renderPiece({
      square: 'e4',
      taken: { from: 'e2', to: 'e4', color: 'b' },
    });

    expect(animatedStyleOf(piece).opacity).toBe(1);
  });

  it('drops where the finger is, not where the drag activated from', async () => {
    const { testID, onDragRelease } = await renderPiece();

    // Up 80 points: the finger ends just inside e4. Measured from where the
    // drag activated (TAP_MOVEMENT_THRESHOLD in), it would still be over e3.
    await dragPiece(testID, 0, -80);

    expect(onDragRelease).toHaveBeenCalledWith('e2', 'e4');
  });

  it('drops where it was last drawn, not where a quick flick lifts', async () => {
    const { piece, testID, onDragRelease } = await renderPiece();

    // Drawn last with the finger over e4, lifted over e5 - where the pawn
    // can't go - as the finger carried on.
    await flickPiece(testID, 0, -80, 0, -130);

    expect(onDragRelease).toHaveBeenCalledWith('e2', 'e4');
    const e4 = getXYFromSquare('e4', width);
    expect(animatedStyleOf(piece)).toMatchObject({
      transform: [{ translateX: e4.x }, { translateY: e4.y }, { scale: 1 }],
    });
  });

  it('drops where the finger rested, not where it slid as it lifted', async () => {
    const { piece, testID, onDragRelease } = await renderPiece();

    // Over e4 for a while, then onto e5 just as it lifts.
    await dragThenMoveOnLift(testID, 0, -100, 200, 0, -150, 10);

    expect(onDragRelease).toHaveBeenCalledWith('e2', 'e4');
    const e4 = getXYFromSquare('e4', width);
    expect(animatedStyleOf(piece)).toMatchObject({
      transform: [{ translateX: e4.x }, { translateY: e4.y }, { scale: 1 }],
    });
  });

  it('goes home when the finger shot more than a square on as it lifted', async () => {
    const { piece, testID, onDragRelease } = await renderPiece();

    // Over e3 for a while, then thrown on to e5 as it lifts: e3 or e4 could
    // have been meant.
    await dragThenMoveOnLift(testID, 0, -50, 200, 0, -150, 10);

    expect(onDragRelease).toHaveBeenCalledWith('e2', 'e5');
    expect(animatedStyleOf(piece)).toMatchObject({
      transform: [{ translateX: home.x }, { translateY: home.y }, { scale: 1 }],
    });
  });

  it('drops on a square the finger was moved on to before lifting', async () => {
    const { testID, onDragRelease } = await renderPiece();

    // Over e3, then over e4 for a while before it lifts.
    await dragThenMoveOnLift(testID, 0, -50, 200, 0, -100, 200);

    expect(onDragRelease).toHaveBeenCalledWith('e2', 'e4');
  });

  it('is set down once, though the drag is reported cancelled after it ended', async () => {
    const { piece, testID, onDragRelease } = await renderPiece();

    await dragPieceThenCancelled(testID, 0, -100);

    expect(onDragRelease).toHaveBeenCalledTimes(1);
    const e4 = getXYFromSquare('e4', width);
    expect(animatedStyleOf(piece)).toMatchObject({
      transform: [{ translateX: e4.x }, { translateY: e4.y }, { scale: 1 }],
    });
  });

  it('goes back home when dropped where it has no legal move', async () => {
    const { piece, testID } = await renderPiece();

    // e5 - three squares up.
    await dragPiece(testID, 0, -150);

    expect(animatedStyleOf(piece)).toMatchObject({
      transform: [{ translateX: home.x }, { translateY: home.y }, { scale: 1 }],
      zIndex: 0,
    });
  });

  it('goes back home when dropped off the board', async () => {
    const { piece, testID } = await renderPiece();

    await dragPiece(testID, 400, 0);

    expect(animatedStyleOf(piece)).toMatchObject({
      transform: [{ translateX: home.x }, { translateY: home.y }, { scale: 1 }],
    });
  });

  it('takes no touches at all once taken', async () => {
    const { piece } = await renderPiece({ captured: true });

    expect(piece.props.pointerEvents).toBe('none');
  });

  describe('on a board facing black', () => {
    // Turned round with the pieces layer (see Chessboard): up the screen is
    // down the board, from white's side.
    const blackSide = {
      square: 'e7' as Square,
      orientation: 'b' as Color,
      legalTargets: { e7: ['e6', 'e5'] as Square[] },
    };

    it('stands its image back upright', async () => {
      const { piece } = await renderPiece(blackSide);

      expect(piece.children[0]).toHaveStyle({
        transform: [{ rotate: '180deg' }],
      });
    });

    it('follows the finger up the screen, toward rank 1', async () => {
      const { testID, x, y } = await renderPiece(blackSide);

      // Up the screen by one square, the piece drawn a square above.
      await holdDrag(testID, 0, -width);

      const e7 = getXYFromSquare('e7', width);
      expect({ x: x.get(), y: y.get() }).toEqual({
        x: e7.x,
        y: e7.y + width + width * DRAG_LIFT,
      });
    });

    it("lands on the square it was dropped on, from white's side", async () => {
      const { testID, x, y, onDragRelease } = await renderPiece(blackSide);

      // Up the screen by two squares: e5.
      await dragPiece(testID, 0, -2 * width);

      expect(onDragRelease).toHaveBeenCalledWith('e7', 'e5');
      expect({ x: x.get(), y: y.get() }).toEqual(getXYFromSquare('e5', width));
    });
  });
});
