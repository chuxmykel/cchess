import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';

import Piece from '.';
import { TAP_MOVEMENT_THRESHOLD } from '../../../../constants';
import { simulatePanResponderDrag, simulatePanResponderTap } from '../../../../testUtils/panResponderGesture';
import { getAnimatedValue } from "../../../../testUtils/animatedValue";
import { getXYFromSquare } from "../../../../utils";

describe("Piece", () => {
  const width = 50;
  const position = getXYFromSquare("e2", width);

  async function renderPiece(
    overrides: Partial<{
      disabled: boolean;
      onMove: jest.Mock;
      onDrag: jest.Mock;
      onSquarePress: jest.Mock;
      resetSelectedSquare: jest.Mock;
    }> = {},
  ) {
    const onMove = overrides.onMove ?? jest.fn();
    const onDrag = overrides.onDrag ?? jest.fn();
    const onSquarePress = overrides.onSquarePress ?? jest.fn();
    const resetSelectedSquare = overrides.resetSelectedSquare ?? jest.fn();
    const animatedPosition = new Animated.ValueXY(position);
    const screen = await render(
      <Piece
        width={width}
        position={position}
        animatedPosition={animatedPosition}
        id="wp"
        disabled={overrides.disabled ?? false}
        opacity={new Animated.Value(1)}
        onMove={onMove}
        onDrag={onDrag}
        onSquarePress={onSquarePress}
        resetSelectedSquare={resetSelectedSquare}
        showDragGuide={jest.fn()}
        hideDragGuide={jest.fn()}
        showValidMovesGuide={jest.fn()}
        clearValidMovesGuide={jest.fn()}
      />,
    );
    const piece = screen.getByTestId("piece-e2");
    return {
      piece,
      onMove,
      onDrag,
      onSquarePress,
      resetSelectedSquare,
      animatedPosition,
    };
  }

  it("should exist", () => {
    expect(Piece).toBeDefined();
  });

  it("should call onMove with the piece's from/to positions when dragged past the tap threshold", async () => {
    const { piece, onMove, onSquarePress } = await renderPiece();

    // Drag up by 2 squares (width 50 * 2 = 100px) - well past the threshold.
    await simulatePanResponderDrag(piece, 0, -100);

    expect(onMove).toHaveBeenCalledWith(position, { x: 200, y: 200 });
    expect(onSquarePress).not.toHaveBeenCalled();
  });

  it("should call onSquarePress instead of onMove when movement stays under the tap threshold", async () => {
    const { piece, onMove, onSquarePress } = await renderPiece();

    await simulatePanResponderTap(piece);

    expect(onSquarePress).toHaveBeenCalledWith("e2");
    expect(onMove).not.toHaveBeenCalled();
  });

  it("should still treat a tap on a disabled (opponent's) piece as a square press", async () => {
    const { piece, onMove, onSquarePress } = await renderPiece({
      disabled: true,
    });

    await simulatePanResponderTap(piece);

    expect(onSquarePress).toHaveBeenCalledWith("e2");
    expect(onMove).not.toHaveBeenCalled();
  });

  it("should not call onMove when a disabled (opponent's) piece is dragged", async () => {
    const { piece, onMove, onDrag } = await renderPiece({ disabled: true });

    await simulatePanResponderDrag(piece, 0, -100);

    expect(onMove).not.toHaveBeenCalled();
    expect(onDrag).not.toHaveBeenCalled();
  });

  it("movement right at the threshold boundary counts as a drag, not a tap", async () => {
    const { piece, onMove, onSquarePress } = await renderPiece();

    // TAP_MOVEMENT_THRESHOLD itself is excluded by the component's strict "<" check.
    await simulatePanResponderDrag(piece, TAP_MOVEMENT_THRESHOLD, 0);

    expect(onSquarePress).not.toHaveBeenCalled();
    expect(onMove).toHaveBeenCalled();
  });

  it("should call resetSelectedSquare on any real drag, including one that doesn't move the piece", async () => {
    const { piece, resetSelectedSquare } = await renderPiece();

    await simulatePanResponderDrag(piece, 0, -100);

    expect(resetSelectedSquare).toHaveBeenCalled();
  });

  it("should call resetSelectedSquare even when dragging a disabled (opponent's) piece", async () => {
    const { piece, resetSelectedSquare, onMove } = await renderPiece({
      disabled: true,
    });

    await simulatePanResponderDrag(piece, 0, -100);

    expect(resetSelectedSquare).toHaveBeenCalled();
    expect(onMove).not.toHaveBeenCalled();
  });

  it("should not call resetSelectedSquare on a tap (only a real drag should invalidate a prior selection)", async () => {
    const { piece, resetSelectedSquare } = await renderPiece();

    await simulatePanResponderTap(piece);

    expect(resetSelectedSquare).not.toHaveBeenCalled();
  });

  it("should snap the piece back to its own square when incidental jitter during a tap stays under the threshold", async () => {
    const { piece, animatedPosition, onSquarePress } = await renderPiece();

    // onPanResponderMove isn't gated by the tap threshold - even a few
    // pixels of finger jitter during what's still classified as a tap
    // nudges animatedPosition via setValue. Since a tap never reaches
    // onMove, nothing else would put it back - the release handler itself
    // must reset it.
    await simulatePanResponderDrag(piece, 5, -5);

    expect(onSquarePress).toHaveBeenCalledWith("e2");
    expect(getAnimatedValue(animatedPosition.x)).toBe(position.x);
    expect(getAnimatedValue(animatedPosition.y)).toBe(position.y);
  });
});
