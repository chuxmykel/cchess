import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { Square } from 'chess.js';

import { usePieceGesture, PieceGestureInput } from '../usePieceGesture';
import { TAP_MOVEMENT_THRESHOLD } from '../../constants';
import { getXYFromSquare } from '../../domain/boardCoordinates';
import {
  simulatePanResponderDrag,
  simulatePanResponderGrant,
  simulatePanResponderGrantAndMove,
  simulatePanResponderTap,
} from '../../testUtils/panResponderGesture';
import { getAnimatedValue } from '../../testUtils/animatedValue';

// A minimal host component so the hook's panHandlers can be driven through
// the same fireEvent-based gesture simulation used elsewhere - renderHook
// alone has no host node to attach a PanResponder to.
function GestureHarness(props: PieceGestureInput & { square: Square }) {
  const { square, ...gestureProps } = props;
  const { panHandlers, scale, zIndex } = usePieceGesture(gestureProps, square);

  return (
    <Animated.View
      testID="gesture-target"
      style={{ transform: [{ scale }], zIndex }}
      {...panHandlers}
    />
  );
}

describe('usePieceGesture', () => {
  const width = 50;
  const position = getXYFromSquare('e2', width);

  async function renderGesture(
    overrides: Partial<{
      disabled: boolean;
      onTap: jest.Mock;
      onDragRelease: jest.Mock;
      onDragStart: jest.Mock;
      onDrag: jest.Mock;
      showDragGuide: jest.Mock;
      hideDragGuide: jest.Mock;
    }> = {},
  ) {
    const onTap = overrides.onTap ?? jest.fn();
    const onDragRelease = overrides.onDragRelease ?? jest.fn();
    const onDragStart = overrides.onDragStart ?? jest.fn();
    const onDrag = overrides.onDrag ?? jest.fn();
    const showDragGuide = overrides.showDragGuide ?? jest.fn();
    const hideDragGuide = overrides.hideDragGuide ?? jest.fn();
    const animatedPosition = new Animated.ValueXY(position);

    const screen = await render(
      <GestureHarness
        square="e2"
        width={width}
        position={position}
        animatedPosition={animatedPosition}
        disabled={overrides.disabled ?? false}
        onTap={onTap}
        onDragRelease={onDragRelease}
        onDragStart={onDragStart}
        onDrag={onDrag}
        showDragGuide={showDragGuide}
        hideDragGuide={hideDragGuide}
      />,
    );
    const target = screen.getByTestId('gesture-target');
    return {
      target,
      animatedPosition,
      onTap,
      onDragRelease,
      onDragStart,
      onDrag,
      showDragGuide,
      hideDragGuide,
    };
  }

  it('should exist', () => {
    expect(usePieceGesture).toBeDefined();
  });

  it("reports onDragRelease with the piece's from/to squares when dragged past the tap threshold", async () => {
    const { target, onDragRelease } = await renderGesture();

    // Drag up by 2 squares (width 50 * 2 = 100px) - well past the threshold.
    await simulatePanResponderDrag(target, 0, -100);

    expect(onDragRelease).toHaveBeenCalledWith('e2', 'e4');
  });

  it('does not report onTap on touch-down for a gesture that turns into a drag', async () => {
    const { target, onTap } = await renderGesture();

    await simulatePanResponderDrag(target, 0, -100);

    expect(onTap).not.toHaveBeenCalled();
  });

  it('reports onDragStart on touch-down, instead of onTap', async () => {
    const { target, onDragStart } = await renderGesture();

    await simulatePanResponderGrant(target);

    expect(onDragStart).toHaveBeenCalledWith('e2');
  });

  it("does not report onDragStart on touch-down for a disabled (opponent's) piece", async () => {
    const { target, onDragStart } = await renderGesture({ disabled: true });

    await simulatePanResponderGrant(target);

    expect(onDragStart).not.toHaveBeenCalled();
  });

  it('reports onTap instead of onDragRelease when movement stays under the tap threshold', async () => {
    const { target, onDragRelease, onTap } = await renderGesture();

    // Nonzero movement, but still under TAP_MOVEMENT_THRESHOLD (10).
    await simulatePanResponderDrag(target, 5, -5);

    expect(onTap).toHaveBeenCalledWith('e2');
    expect(onDragRelease).not.toHaveBeenCalled();
  });

  it("still reports a tap on a disabled (opponent's) piece, so it can be used as a move's target", async () => {
    const { target, onTap, onDragRelease } = await renderGesture({
      disabled: true,
    });

    await simulatePanResponderTap(target);

    expect(onTap).toHaveBeenCalledWith('e2');
    expect(onDragRelease).not.toHaveBeenCalled();
  });

  it("still reports a real drag's outcome on release even for a disabled (opponent's) piece - legality is the caller's call", async () => {
    const { target, onDragRelease } = await renderGesture({ disabled: true });

    await simulatePanResponderDrag(target, 0, -100);

    expect(onDragRelease).toHaveBeenCalledWith('e2', 'e4');
  });

  it('movement right at the threshold boundary counts as a drag, not a tap', async () => {
    const { target, onDragRelease, onTap } = await renderGesture();

    // TAP_MOVEMENT_THRESHOLD itself is excluded by the hook's strict "<" check.
    await simulatePanResponderDrag(target, TAP_MOVEMENT_THRESHOLD, 0);

    expect(onDragRelease).toHaveBeenCalled();
    expect(onTap).not.toHaveBeenCalled();
  });

  it('snaps the piece back to its own square when incidental jitter during a tap stays under the threshold', async () => {
    const { target, animatedPosition, onTap } = await renderGesture();

    await simulatePanResponderDrag(target, 5, -5);

    expect(onTap).toHaveBeenCalledWith('e2');
    expect(getAnimatedValue(animatedPosition.x)).toBe(position.x);
    expect(getAnimatedValue(animatedPosition.y)).toBe(position.y);
  });

  it('shows the drag guide during a drag and hides it on release', async () => {
    const { target, showDragGuide, hideDragGuide } = await renderGesture();

    await simulatePanResponderDrag(target, 0, -100);

    expect(showDragGuide).toHaveBeenCalled();
    expect(hideDragGuide).toHaveBeenCalled();
  });

  it('hides the drag guide on release even for a plain tap', async () => {
    const { target, hideDragGuide } = await renderGesture();

    await simulatePanResponderTap(target);

    expect(hideDragGuide).toHaveBeenCalled();
  });

  it('zooms the piece in while actively dragging', async () => {
    const { target } = await renderGesture();

    await simulatePanResponderGrantAndMove(target, 0, -100);

    expect(target.props.style.transform[0].scale).toBe(1.4);
    expect(target.props.style.zIndex).toBe(100);
  });

  it('zooms back out once the drag is released', async () => {
    const { target } = await renderGesture();

    await simulatePanResponderDrag(target, 0, -100);

    expect(target.props.style.transform[0].scale).toBe(1);
    expect(target.props.style.zIndex).toBe(0);
  });
});
