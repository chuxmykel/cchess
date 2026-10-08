import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';

import Piece from '.';
import { TAP_MOVEMENT_THRESHOLD } from '../../../../constants';
import {
  simulatePanResponderDrag,
  simulatePanResponderTap,
} from '../../../../testUtils/panResponderGesture';
import { getAnimatedValue } from '../../../../testUtils/animatedValue';
import { getXYFromSquare } from '../../../../domain/boardCoordinates';

describe('Piece', () => {
  const width = 50;
  const position = getXYFromSquare('e2', width);

  async function renderPiece(
    overrides: Partial<{
      disabled: boolean;
      onTap: jest.Mock;
      onDragRelease: jest.Mock;
      onDragStart: jest.Mock;
      onDrag: jest.Mock;
    }> = {},
  ) {
    const onTap = overrides.onTap ?? jest.fn();
    const onDragRelease = overrides.onDragRelease ?? jest.fn();
    const onDragStart = overrides.onDragStart ?? jest.fn();
    const onDrag = overrides.onDrag ?? jest.fn();
    const animatedPosition = new Animated.ValueXY(position);
    const screen = await render(
      <Piece
        width={width}
        position={position}
        animatedPosition={animatedPosition}
        id="wp"
        disabled={overrides.disabled ?? false}
        opacity={new Animated.Value(1)}
        onTap={onTap}
        onDragRelease={onDragRelease}
        onDragStart={onDragStart}
        onDrag={onDrag}
        showDragGuide={jest.fn()}
        hideDragGuide={jest.fn()}
      />,
    );
    const piece = screen.getByTestId('piece-e2');
    return {
      piece,
      onTap,
      onDragRelease,
      onDragStart,
      onDrag,
      animatedPosition,
    };
  }

  it('should exist', () => {
    expect(Piece).toBeDefined();
  });

  it("should call onDragRelease with the piece's from/to squares when dragged past the tap threshold", async () => {
    const tapThreshold = 50;
    const { piece, onDragRelease } = await renderPiece();

    // Drag up by 2 squares (width 50 * 2 = 100px) - well past the threshold.
    await simulatePanResponderDrag(piece, 0, -(tapThreshold * 2));

    expect(onDragRelease).toHaveBeenCalledWith('e2', 'e4');
  });

  it('should not call onTap on touch-down for a gesture that turns into a drag', async () => {
    const { piece, onTap } = await renderPiece();

    await simulatePanResponderDrag(piece, 0, -100);

    expect(onTap).not.toHaveBeenCalled();
  });

  it('should call onDragStart on touch-down, instead of onTap', async () => {
    const { piece, onDragStart } = await renderPiece();

    await simulatePanResponderDrag(piece, 0, -100);

    expect(onDragStart).toHaveBeenCalledWith('e2');
  });

  it("should not call onDragStart on touch-down for a disabled (opponent's) piece", async () => {
    const { piece, onDragStart } = await renderPiece({ disabled: true });

    await simulatePanResponderDrag(piece, 0, -100);

    expect(onDragStart).not.toHaveBeenCalled();
  });

  it('should call onTap instead of onDragRelease when movement stays under the tap threshold', async () => {
    const { piece, onDragRelease, onTap } = await renderPiece();

    await simulatePanResponderTap(piece);

    expect(onTap).toHaveBeenCalledWith('e2');
    expect(onDragRelease).not.toHaveBeenCalled();
  });

  it("should still report a tap on a disabled (opponent's) piece, so it can be used as a move's target", async () => {
    const { piece, onTap, onDragRelease } = await renderPiece({
      disabled: true,
    });

    await simulatePanResponderTap(piece);

    expect(onTap).toHaveBeenCalledWith('e2');
    expect(onDragRelease).not.toHaveBeenCalled();
  });

  it("should not report onTap or onDrag on touch-down for a disabled (opponent's) piece", async () => {
    const { piece, onTap, onDrag } = await renderPiece({ disabled: true });

    await simulatePanResponderDrag(piece, 0, -100);

    expect(onTap).not.toHaveBeenCalled();
    expect(onDrag).not.toHaveBeenCalled();
  });

  it("should still report a real drag's outcome on release even for a disabled (opponent's) piece - legality is the caller's call", async () => {
    const { piece, onDragRelease } = await renderPiece({ disabled: true });

    await simulatePanResponderDrag(piece, 0, -100);

    expect(onDragRelease).toHaveBeenCalledWith('e2', 'e4');
  });

  it('movement right at the threshold boundary counts as a drag, not a tap', async () => {
    const { piece, onDragRelease, onTap } = await renderPiece();

    await simulatePanResponderDrag(piece, TAP_MOVEMENT_THRESHOLD, 0);

    expect(onDragRelease).toHaveBeenCalled();
    expect(onTap).not.toHaveBeenCalled();
  });

  it('should snap the piece back to its own square when incidental jitter during a tap stays under the threshold', async () => {
    const { piece, animatedPosition, onTap } = await renderPiece();

    await simulatePanResponderDrag(piece, 5, -5);

    expect(onTap).toHaveBeenCalledWith('e2');
    expect(getAnimatedValue(animatedPosition.x)).toBe(position.x);
    expect(getAnimatedValue(animatedPosition.y)).toBe(position.y);
  });
});
