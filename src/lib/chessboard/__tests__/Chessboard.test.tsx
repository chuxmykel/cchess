import { fireEvent, render, within } from '@testing-library/react-native';
import { getByGestureTestId } from 'react-native-gesture-handler/jest-utils';

import { Chessboard, ChessboardProps, defaultPieceSet, PieceSet } from '..';
import { getXYFromSquare } from '../coordinates';
import { usePieceGesture } from '../hooks/usePieceGesture';
import { animatedStyleOf } from '../../../testUtils/animatedValue';
import { piecePositionOnScreen } from '../../../testUtils/boardPosition';
import {
  dragPiece,
  dragPieceWhile,
  settleAnimations,
  tapPiece,
  touchPiece,
} from '../../../testUtils/pieceGestures';

// Passed straight through, only so a test can count the pieces' renders.
jest.mock('../hooks/usePieceGesture', () => {
  const actual = jest.requireActual('../hooks/usePieceGesture');
  return { ...actual, usePieceGesture: jest.fn(actual.usePieceGesture) };
});

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
  premove: 'purple',
};
// Only what the board's told: no rules of its own.
const E2_MOVES = { e2: ['e3', 'e4'] } as ChessboardProps['movable']['dests'];

function board(props: Partial<ChessboardProps> = {}) {
  return <Chessboard fen={START} size={SIZE} colors={COLORS} {...props} />;
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

  it('is a square of the size given', async () => {
    const screen = await render(board());

    expect(screen.getByTestId('chessboard')).toHaveStyle({
      width: SIZE,
      height: SIZE,
    });
  });

  describe('re-renders no piece - which would set its gestures up again, cancelling a drag - when', () => {
    const movable = { color: 'w' as const, dests: E2_MOVES };

    it('given the same props again, as by a screen re-rendering around it', async () => {
      const onMove = jest.fn();
      const screen = await render(board({ movable, onMove }));
      jest.mocked(usePieceGesture).mockClear();

      await screen.rerender(board({ movable, onMove }));

      expect(usePieceGesture).not.toHaveBeenCalled();
    });

    it('handed new callbacks, as an app hands over on every render', async () => {
      const screen = await render(board({ movable, onMove: () => {} }));
      jest.mocked(usePieceGesture).mockClear();

      await screen.rerender(
        board({ movable, onMove: () => {}, onSquarePress: () => {} }),
      );

      expect(usePieceGesture).not.toHaveBeenCalled();
    });
  });

  describe.each(['w', 'b'] as const)(
    'the drag guide, facing %s',
    (orientation) => {
      const movable = { color: 'w' as const, dests: E2_MOVES };

      it('is hidden before any touch', async () => {
        const screen = await render(board({ movable, orientation }));

        expect(animatedStyleOf(screen.getByTestId('drag-guide')).opacity).toBe(
          0,
        );
      });

      it("shows on the touched piece's own square at touch-down", async () => {
        const screen = await render(board({ movable, orientation }));

        await touchPiece('piece-e2');

        const guide = animatedStyleOf(screen.getByTestId('drag-guide'));
        const [{ translateX }, { translateY }] = guide.transform;
        expect(guide.opacity).toBe(1);
        expect({ x: translateX, y: translateY }).toEqual(
          getXYFromSquare('e2', SQUARE, orientation),
        );
      });
    },
  );

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

  it('draws its own pieces unless given a set', async () => {
    const svgOn = (
      screen: Awaited<ReturnType<typeof render>>,
      square: string,
    ) =>
      within(screen.getByTestId(`piece-${square}`)).getByTestId('drawing').props
        .xml;
    const screen = await render(board());
    expect(svgOn(screen, 'e1')).toBe(defaultPieceSet.wk);
    expect(svgOn(screen, 'g8')).toBe(defaultPieceSet.bn);

    const pieceSet = Object.fromEntries(
      Object.keys(defaultPieceSet).map((code) => [code, `<svg id="${code}"/>`]),
    ) as PieceSet;
    await screen.rerender(board({ pieceSet }));

    expect(svgOn(screen, 'e1')).toBe('<svg id="wk"/>');
    expect(svgOn(screen, 'g8')).toBe('<svg id="bn"/>');
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

    it("puts a piece down, at home and its own size, when it can't move any more by the time it's let go", async () => {
      const onMove = jest.fn();
      const screen = await render(board({ movable, onMove }));

      // The game ends - a clock runs out - with the piece still held.
      await dragPieceWhile('piece-e2', 0, -2 * SQUARE, async () => {
        await screen.rerender(board({ movable: null, onMove }));
      });

      expect(onMove).not.toHaveBeenCalled();
      expect(onScreen(screen, 'e2')).toEqual(getXYFromSquare('e2', SQUARE));
      expect(animatedStyleOf(screen.getByTestId('piece-e2')).transform).toEqual(
        expect.arrayContaining([{ scale: 1 }]),
      );
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

  describe('premove', () => {
    // Black to move: white waits, and can queue e2-e4.
    const movable: ChessboardProps['movable'] = {
      color: 'b',
      dests: { e7: ['e5'] },
    };
    const premovable = { color: 'w' as const, dests: E2_MOVES };

    it('queues a move dropped on a premove dest, the piece staying home', async () => {
      const onMove = jest.fn();
      const onPremove = jest.fn();
      const screen = await render(
        board({ movable, premovable, onMove, onPremove }),
      );

      await dragPiece('piece-e2', 0, -2 * SQUARE);

      expect(onPremove).toHaveBeenCalledWith('e2', 'e4');
      expect(onMove).not.toHaveBeenCalled();
      expect(onScreen(screen, 'e2')).toEqual(getXYFromSquare('e2', SQUARE));
    });

    it("takes nothing where it's queued to go", async () => {
      const screen = await render(
        board({
          movable,
          premovable: { color: 'w', dests: { d1: ['d7'] } },
          onPremove: jest.fn(),
        }),
      );

      await dragPiece('piece-d1', 0, -6 * SQUARE);

      expect(animatedStyleOf(screen.getByTestId('piece-d7')).opacity).toBe(1);
    });

    it('queues a move tapped, showing its dests first', async () => {
      const onPremove = jest.fn();
      const screen = await render(board({ movable, premovable, onPremove }));

      await tapPiece('piece-e2');
      expect(dotShown(screen, 'e4')).toBe(true);
      await fireEvent.press(screen.getByTestId('square-e4'));

      expect(onPremove).toHaveBeenCalledWith('e2', 'e4');
    });

    it('marks the move queued', async () => {
      const screen = await render(
        board({
          movable,
          premovable: { ...premovable, current: { from: 'e2', to: 'e4' } },
        }),
      );

      expect(screen.getByTestId('premove-to')).toHaveStyle({
        ...{ left: 4 * SQUARE, top: 4 * SQUARE },
        backgroundColor: 'purple',
      });
    });

    it('drops the move queued on a tap anywhere else, or a drop on no dest', async () => {
      const onPremoveCancel = jest.fn();
      const screen = await render(
        board({
          movable,
          premovable: { ...premovable, current: { from: 'e2', to: 'e4' } },
          onPremoveCancel,
        }),
      );

      await fireEvent.press(screen.getByTestId('square-d5'));
      expect(onPremoveCancel).toHaveBeenCalledTimes(1);

      await dragPiece('piece-e2', 0, -3 * SQUARE);
      expect(onPremoveCancel).toHaveBeenCalledTimes(2);
    });

    it('still moves the side whose turn it is', async () => {
      const onMove = jest.fn();
      const onPremove = jest.fn();
      await render(board({ movable, premovable, onMove, onPremove }));

      await dragPiece('piece-e7', 0, 2 * SQUARE);

      expect(onMove).toHaveBeenCalledWith('e7', 'e5');
      expect(onPremove).not.toHaveBeenCalled();
    });

    it('marks nothing, and queues nothing, on a view-only board', async () => {
      const onPremove = jest.fn();
      const screen = await render(
        board({
          viewOnly: true,
          premovable: { ...premovable, current: { from: 'e2', to: 'e4' } },
          onPremove,
        }),
      );

      expect(screen.queryByTestId('premove-to')).toBeNull();
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
