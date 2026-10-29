import { render } from '@testing-library/react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, { makeMutable } from 'react-native-reanimated';
import { Square } from 'chess.js';

import { usePieceGesture, PieceGestureInput } from '../usePieceGesture';
import { getXYFromSquare } from '../../domain/boardCoordinates';
import {
  dragPiece,
  holdDrag,
  settleAnimations,
  tapPiece,
} from '../../testUtils/pieceGestures';

// Most of what this hook does shows on a piece and is tested through Piece
// itself; this covers the rest.
type HarnessProps = Omit<PieceGestureInput, 'x' | 'y' | 'dragGuide'> & {
  onScaleAndZIndex?: (read: () => { scale: number; zIndex: number }) => void;
};

function GestureHarness({ onScaleAndZIndex, ...props }: HarnessProps) {
  const position = getXYFromSquare(props.square, props.width);
  const { gesture, scale, zIndex } = usePieceGesture({
    ...props,
    x: makeMutable(position.x),
    y: makeMutable(position.y),
    dragGuide: {
      x: makeMutable(0),
      y: makeMutable(0),
      opacity: makeMutable(0),
      origin: makeMutable<{ x: number; y: number } | null>(null),
      taken: makeMutable(null),
    },
  });
  onScaleAndZIndex?.(() => ({ scale: scale.get(), zIndex: zIndex.get() }));
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View testID="gesture-target" />
    </GestureDetector>
  );
}

describe('usePieceGesture', () => {
  const width = 50;

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function harness(square: Square, overrides: Partial<HarnessProps> = {}) {
    return (
      <GestureHandlerRootView>
        <GestureHarness
          square={square}
          color="w"
          width={width}
          orientation="w"
          disabled={false}
          legalTargets={makeMutable({ e2: ['e3', 'e4'] as Square[] })}
          onTap={jest.fn()}
          onDragStart={jest.fn()}
          onDragRelease={jest.fn()}
          testID="piece"
          {...overrides}
        />
      </GestureHandlerRootView>
    );
  }

  it('keeps a piece dropped on a move above the others until the move is made', async () => {
    let read: () => { scale: number; zIndex: number };
    const onScaleAndZIndex = (reader: typeof read) => (read = reader);
    const screen = await render(harness('e2', { onScaleAndZIndex }));

    await holdDrag('piece', 0, -100);
    expect(read().zIndex).toBe(100);

    // Landed on e4, but the game hasn't moved it there yet.
    await dragPiece('piece', 0, -100);
    expect(read()).toEqual({ scale: 1, zIndex: 100 });

    await screen.rerender(harness('e4', { onScaleAndZIndex }));
    await settleAnimations(16);
    expect(read().zIndex).toBe(0);
  });

  it('keeps a piece sent home above the others until it is there', async () => {
    let read: () => { scale: number; zIndex: number };
    await render(
      harness('e2', { onScaleAndZIndex: (reader) => (read = reader) }),
    );

    // e5: no move.
    await dragPiece('piece', 0, -150);

    expect(read()).toEqual({ scale: 1, zIndex: 0 });
  });

  it('reports the square the piece is on now, after it has moved', async () => {
    const onTap = jest.fn();
    const onDragRelease = jest.fn();
    const screen = await render(harness('e2', { onTap, onDragRelease }));

    await screen.rerender(harness('e4', { onTap, onDragRelease }));
    await settleAnimations(16);
    await tapPiece('piece');
    await dragPiece('piece', 0, -50);

    expect(onTap).toHaveBeenCalledWith('e4');
    expect(onDragRelease).toHaveBeenCalledWith('e4', 'e5');
  });

  it('calls the callbacks it was last given', async () => {
    const first = jest.fn();
    const latest = jest.fn();
    const screen = await render(harness('e2', { onTap: first }));

    await screen.rerender(harness('e2', { onTap: latest }));
    await settleAnimations(16);
    await tapPiece('piece');

    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledWith('e2');
  });
});
