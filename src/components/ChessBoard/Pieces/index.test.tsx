import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { Square } from 'chess.js';

import Pieces from '.';
import { AnimatedPieceView } from '../../../hooks/usePieceAnimations';
import { getXYFromSquare } from '../../../domain/boardCoordinates';
import { simulatePanResponderDrag } from '../../../testUtils/panResponderGesture';

describe('Pieces', () => {
  const pieceWidth = 50;

  function buildPiece(
    square: Square,
    spriteId: AnimatedPieceView['spriteId'],
  ): AnimatedPieceView {
    return {
      id: `${spriteId}-${square}`,
      spriteId,
      square,
      animatedPosition: new Animated.ValueXY(
        getXYFromSquare(square, pieceWidth),
      ),
      opacity: new Animated.Value(1),
    };
  }

  async function renderPieces(
    overrides: Partial<{
      pieces: AnimatedPieceView[];
      isOwnPieceAt: (square: Square) => boolean;
      isGameOver: boolean;
    }> = {},
  ) {
    const pieces = overrides.pieces ?? [buildPiece('e2', 'wp')];
    const isOwnPieceAt = overrides.isOwnPieceAt ?? jest.fn(() => true);
    const isGameOver = overrides.isGameOver ?? false;
    const onTap = jest.fn();
    const onDragStart = jest.fn();
    const onDragRelease = jest.fn();
    const onDrag = jest.fn();
    const showDragGuide = jest.fn();
    const hideDragGuide = jest.fn();

    const screen = await render(
      <Pieces
        pieces={pieces}
        pieceWidth={pieceWidth}
        isOwnPieceAt={isOwnPieceAt}
        isGameOver={isGameOver}
        onTap={onTap}
        onDragStart={onDragStart}
        onDragRelease={onDragRelease}
        onDrag={onDrag}
        showDragGuide={showDragGuide}
        hideDragGuide={hideDragGuide}
      />,
    );

    return { screen, onTap, onDragStart, onDragRelease, onDrag };
  }

  it('should exist', () => {
    expect(Pieces).toBeDefined();
  });

  it('renders one Piece per entry, keyed by square', async () => {
    const pieces = [buildPiece('e2', 'wp'), buildPiece('e7', 'bp')];
    const { screen } = await renderPieces({ pieces });

    expect(screen.getByTestId('piece-e2')).toBeDefined();
    expect(screen.getByTestId('piece-e7')).toBeDefined();
  });

  it("enables dragging a piece isOwnPieceAt reports as the player's own", async () => {
    const { screen, onDragStart } = await renderPieces({
      isOwnPieceAt: () => true,
      isGameOver: false,
    });

    await simulatePanResponderDrag(screen.getByTestId('piece-e2'), 0, -100);

    expect(onDragStart).toHaveBeenCalledWith('e2');
  });

  it("disables dragging a piece isOwnPieceAt reports as the opponent's", async () => {
    const { screen, onDragStart } = await renderPieces({
      isOwnPieceAt: () => false,
    });

    await simulatePanResponderDrag(screen.getByTestId('piece-e2'), 0, -100);

    expect(onDragStart).not.toHaveBeenCalled();
  });

  it("disables dragging every piece once the game is over, even the player's own", async () => {
    const { screen, onDragStart } = await renderPieces({
      isOwnPieceAt: () => true,
      isGameOver: true,
    });

    await simulatePanResponderDrag(screen.getByTestId('piece-e2'), 0, -100);

    expect(onDragStart).not.toHaveBeenCalled();
  });
});
