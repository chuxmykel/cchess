import { fireEvent, render } from '@testing-library/react-native';
import { getByGestureTestId } from 'react-native-gesture-handler/jest-utils';

import { Chessboard, ChessboardProps, PieceImages } from '..';
import { getXYFromSquare } from '../coordinates';
import { piecePositionOnScreen } from '../../../testUtils/boardPosition';
import {
  dragPiece,
  settleAnimations,
  tapPiece,
  touchPiece,
} from '../../../testUtils/pieceGestures';

const SIZE = 400;
const SQUARE = SIZE / 8;
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const COLORS = {
  light: 'white',
  dark: 'black',
  lastMove: 'yellow',
  moveHint: 'grey',
  dragOrigin: 'orange',
  check: 'red',
};
const PIECE_IMAGES = new Proxy({} as PieceImages, {
  get: (_, code) => ({ uri: `${String(code)}.png` }),
});

// Only what the board's told: no rules of its own.
const E2_MOVES = { e2: ['e3', 'e4'] } as ChessboardProps['movable']['dests'];

function board(props: Partial<ChessboardProps> = {}) {
  return (
    <Chessboard
      fen={START}
      size={SIZE}
      colors={COLORS}
      pieceImages={PIECE_IMAGES}
      {...props}
    />
  );
}

type Screen = Awaited<ReturnType<typeof render>>;

function dotShown(screen: Screen, square: string) {
  return screen.getByTestId(`valid-move-${square}`).props.style.opacity === 1;
}

function onScreen(screen: Screen, square: string) {
  return piecePositionOnScreen(
    screen.getByTestId(`piece-${square}`),
    screen.getByTestId('chessboard-pieces'),
    SQUARE,
  );
}

describe('Chessboard', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('names each piece for a screen reader', async () => {
    const screen = await render(board());

    expect(screen.getByTestId('piece-d1')).toHaveProp(
      'accessibilityLabel',
      'white queen',
    );
    expect(screen.getByTestId('piece-g8')).toHaveProp(
      'accessibilityLabel',
      'black knight',
    );
  });

  it('draws the pieces of a placement', async () => {
    const screen = await render(board());

    expect(screen.getAllByTestId(/^piece-/)).toHaveLength(32);
    expect(onScreen(screen, 'e1')).toEqual(getXYFromSquare('e1', SQUARE));
  });

  describe('tap to move', () => {
    const movable = { color: 'w' as const, dests: E2_MOVES };

    it("shows a movable piece's dests when it's tapped", async () => {
      const screen = await render(board({ movable }));

      await tapPiece('piece-e2');

      expect(dotShown(screen, 'e3')).toBe(true);
      expect(dotShown(screen, 'e4')).toBe(true);
      expect(dotShown(screen, 'e5')).toBe(false);
    });

    it('moves a selected piece to the dest tapped', async () => {
      const onMove = jest.fn();
      const screen = await render(board({ movable, onMove }));

      await tapPiece('piece-e2');
      await fireEvent.press(screen.getByTestId('square-e4'));

      expect(onMove).toHaveBeenCalledWith('e2', 'e4');
      expect(dotShown(screen, 'e4')).toBe(false);
    });

    it('lets go of the selection for a square that is no dest, without a move', async () => {
      const onMove = jest.fn();
      const screen = await render(board({ movable, onMove }));

      await tapPiece('piece-e2');
      await fireEvent.press(screen.getByTestId('square-e5'));
      await fireEvent.press(screen.getByTestId('square-e4'));

      expect(onMove).not.toHaveBeenCalled();
      expect(dotShown(screen, 'e3')).toBe(false);
    });

    it("selects nothing of the side that can't move", async () => {
      const screen = await render(
        board({ movable: { color: 'b', dests: E2_MOVES } }),
      );

      await tapPiece('piece-e2');

      expect(dotShown(screen, 'e3')).toBe(false);
    });

    it('selects nothing when nothing can move', async () => {
      const onMove = jest.fn();
      const screen = await render(board({ onMove }));

      await tapPiece('piece-e2');
      await fireEvent.press(screen.getByTestId('square-e4'));

      expect(dotShown(screen, 'e3')).toBe(false);
      expect(onMove).not.toHaveBeenCalled();
    });

    it('lets go of the selection once the position changes', async () => {
      const screen = await render(board({ movable }));
      await tapPiece('piece-e2');

      await screen.rerender(
        board({
          movable,
          fen: 'rnbqkbnr/pppp1ppp/8/4p3/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 2',
        }),
      );

      expect(dotShown(screen, 'e3')).toBe(false);
    });
  });

  describe('drag and drop', () => {
    const movable = { color: 'w' as const, dests: E2_MOVES };

    it("shows a piece's dests as soon as it's touched", async () => {
      const screen = await render(board({ movable }));

      await touchPiece('piece-e2');

      expect(dotShown(screen, 'e4')).toBe(true);
    });

    it('moves a piece dropped on one of its dests', async () => {
      const onMove = jest.fn();
      await render(board({ movable, onMove }));

      await dragPiece('piece-e2', 0, -2 * SQUARE);

      expect(onMove).toHaveBeenCalledWith('e2', 'e4');
    });

    it('makes no move for a drop that is no dest', async () => {
      const onMove = jest.fn();
      const screen = await render(board({ movable, onMove }));

      await dragPiece('piece-e2', 0, -3 * SQUARE);

      expect(onMove).not.toHaveBeenCalled();
      expect(onScreen(screen, 'e2')).toEqual(getXYFromSquare('e2', SQUARE));
    });

    it('sends a piece home at once when its move is refused', async () => {
      const screen = await render(board({ movable, onMove: () => false }));

      await dragPiece('piece-e2', 0, -2 * SQUARE);

      expect(onScreen(screen, 'e2')).toEqual(getXYFromSquare('e2', SQUARE));
    });

    it('logs each drop, when asked to', async () => {
      const onDragLog = jest.fn();
      await render(board({ movable, onDragLog }));

      await dragPiece('piece-e2', 0, -2 * SQUARE);

      expect(onDragLog).toHaveBeenCalledWith(
        expect.stringContaining('board e2->e4'),
      );
    });
  });

  describe('free', () => {
    const movable = { color: 'both' as const, free: true };

    it('moves any piece anywhere', async () => {
      const onMove = jest.fn();
      await render(board({ movable, onMove }));

      await dragPiece('piece-d8', 0, 4 * SQUARE);

      expect(onMove).toHaveBeenCalledWith('d8', 'd4');
    });

    it('moves a tapped piece to any square tapped', async () => {
      const onMove = jest.fn();
      const screen = await render(board({ movable, onMove }));

      await tapPiece('piece-b1');
      await fireEvent.press(screen.getByTestId('square-h5'));

      expect(onMove).toHaveBeenCalledWith('b1', 'h5');
    });

    it('takes a piece dragged off the board away', async () => {
      const onDropOff = jest.fn();
      const onMove = jest.fn();
      await render(board({ movable, onMove, onDropOff }));

      await dragPiece('piece-e8', 0, -2 * SQUARE);

      expect(onDropOff).toHaveBeenCalledWith('e8');
      expect(onMove).not.toHaveBeenCalled();
    });
  });

  it('reports every square tapped, a piece on it or not', async () => {
    const onSquarePress = jest.fn();
    const screen = await render(board({ onSquarePress }));

    await fireEvent.press(screen.getByTestId('square-d4'));
    await tapPiece('piece-e2');

    expect(onSquarePress).toHaveBeenNthCalledWith(1, 'd4');
    expect(onSquarePress).toHaveBeenNthCalledWith(2, 'e2');
  });

  it('marks the last move', async () => {
    const screen = await render(board({ lastMove: { from: 'e2', to: 'e4' } }));

    expect(screen.getByTestId('last-move-to')).toHaveStyle({
      ...{ left: 4 * SQUARE, top: 4 * SQUARE },
      backgroundColor: 'yellow',
    });
  });

  it('draws arrows over the board', async () => {
    const screen = await render(
      board({
        arrows: [{ from: 'g1', to: 'f3', color: 'green', weight: 0.2 }],
      }),
    );

    expect(screen.getByTestId('arrow-g1f3')).toBeTruthy();
  });

  it('makes the king in check glow', async () => {
    const screen = await render(
      board({ check: { square: 'e1', fallen: false } }),
    );

    expect(screen.getAllByTestId('danger-glow').length).toBeGreaterThan(0);
  });

  describe('view only', () => {
    it('draws the board for no touches at all', async () => {
      const screen = await render(board({ viewOnly: true, testID: 'viewed' }));

      expect(screen.getByTestId('viewed')).toHaveProp('pointerEvents', 'none');
      expect(screen.getAllByTestId(/^piece-/)).toHaveLength(32);
      expect(() => getByGestureTestId('piece-e2-pan')).toThrow();
      expect(screen.queryByTestId('drag-guide')).toBeNull();
    });
  });

  it('turns the pieces round for black, the squares with them', async () => {
    const screen = await render(board({ orientation: 'b' }));

    expect(onScreen(screen, 'e1')).toEqual({ x: 3 * SQUARE, y: 0 });
    await settleAnimations();
  });
});
