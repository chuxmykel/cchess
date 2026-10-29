import { render } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { makeMutable } from 'react-native-reanimated';

import Piece from '.';
import { LegalTargets } from '../../../../domain/types';
import { getXYFromSquare } from '../../../../domain/boardCoordinates';
import { DRAG_SCALE } from '../../../../constants/animations';
import {
  dragPiece,
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
      disabled: boolean;
      captured: boolean;
      legalTargets: LegalTargets;
    }> = {},
  ) {
    const onTap = jest.fn();
    const onDragRelease = jest.fn();
    const onDragStart = jest.fn();
    const x = makeMutable(home.x);
    const y = makeMutable(home.y);
    const dragGuide = {
      x: makeMutable(0),
      y: makeMutable(0),
      opacity: makeMutable(0),
    };
    const captured = overrides.captured ?? false;
    const screen = await render(
      <GestureHandlerRootView>
        <Piece
          id="wp"
          square="e2"
          width={width}
          orientation="w"
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
    const testID = captured ? 'taken-piece-e2' : 'piece-e2';
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

  it('follows the finger, half a square above it, over the other pieces', async () => {
    const { piece, testID } = await renderPiece();

    await holdDrag(testID, 30, -80);

    expect(animatedStyleOf(piece)).toMatchObject({
      transform: [
        { translateX: home.x + 30 },
        { translateY: home.y - 80 - width / 2 },
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
      zIndex: 0,
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
});
