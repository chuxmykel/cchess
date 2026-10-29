import { render } from '@testing-library/react-native';
import { DEFAULT_POSITION } from 'chess.js';

import StaticBoard from '.';
import { NUMBER_OF_ROWS } from '../../../constants';
import { piecePositionOnScreen } from '../../../testUtils/boardPosition';
import { settleAnimations } from '../../../testUtils/pieceGestures';

describe('StaticBoard', () => {
  const width = 400;
  const PIECE_WIDTH = width / NUMBER_OF_ROWS;
  const colors = { light: 'white', dark: 'black' };
  const KINGS_AND_E4_PAWN = '4k3/8/8/8/4P3/8/8/4K3 w - - 0 1';
  const KINGS_AND_E5_PAWN = '4k3/8/8/4P3/8/8/8/4K3 b - - 0 1';

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  type Screen = Awaited<ReturnType<typeof render>>;

  // Where the piece on this square is drawn on screen.
  function onScreen(screen: Screen, square: string) {
    return piecePositionOnScreen(
      screen.getByTestId(`piece-${square}`),
      screen.getByTestId('static-pieces-layer'),
      PIECE_WIDTH,
    );
  }

  it('draws every piece in the position', async () => {
    const screen = await render(
      <StaticBoard fen={DEFAULT_POSITION} colors={colors} width={width} />,
    );

    expect(screen.getAllByTestId(/^piece-/)).toHaveLength(32);
    expect(screen.getAllByTestId('chessboard-row')).toHaveLength(8);
  });

  it('places pieces on their squares from the given side', async () => {
    const fromWhite = await render(
      <StaticBoard fen={KINGS_AND_E4_PAWN} colors={colors} width={width} />,
    );
    expect(onScreen(fromWhite, 'e1')).toEqual({
      x: 4 * PIECE_WIDTH,
      y: 7 * PIECE_WIDTH,
    });

    const fromBlack = await render(
      <StaticBoard
        fen={KINGS_AND_E4_PAWN}
        colors={colors}
        width={width}
        orientation="b"
      />,
    );
    expect(onScreen(fromBlack, 'e1')).toEqual({ x: 3 * PIECE_WIDTH, y: 0 });
  });

  it('moves the same piece to its new square, rather than drawing a new one', async () => {
    const screen = await render(
      <StaticBoard fen={KINGS_AND_E4_PAWN} colors={colors} width={width} />,
    );
    const whiteKing = screen.getByTestId('piece-e1');
    const pawn = screen.getByTestId('piece-e4');

    await screen.rerender(
      <StaticBoard fen={KINGS_AND_E5_PAWN} colors={colors} width={width} />,
    );

    expect(screen.getByTestId('piece-e1')).toBe(whiteKing);
    expect(screen.getByTestId('piece-e5')).toBe(pawn);
    expect(screen.queryByTestId('piece-e4')).toBeNull();
  });

  it('slides a piece to its new square when animated', async () => {
    const onSettled = jest.fn();
    const screen = await render(
      <StaticBoard
        fen={KINGS_AND_E4_PAWN}
        colors={colors}
        width={width}
        animate
        onSettled={onSettled}
      />,
    );
    onSettled.mockClear();

    await screen.rerender(
      <StaticBoard
        fen={KINGS_AND_E5_PAWN}
        colors={colors}
        width={width}
        animate
        onSettled={onSettled}
      />,
    );

    // A frame in: on its way from e4.
    await settleAnimations(16);
    const { y } = onScreen(screen, 'e5');
    expect(y).toBeLessThan(4 * PIECE_WIDTH);
    expect(y).toBeGreaterThan(3 * PIECE_WIDTH);
    expect(onSettled).not.toHaveBeenCalled();

    await settleAnimations();

    expect(onScreen(screen, 'e5')).toEqual({
      x: 4 * PIECE_WIDTH,
      y: 3 * PIECE_WIDTH,
    });
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('puts a piece straight on its new square when not animated', async () => {
    const onSettled = jest.fn();
    const screen = await render(
      <StaticBoard
        fen={KINGS_AND_E4_PAWN}
        colors={colors}
        width={width}
        onSettled={onSettled}
      />,
    );
    onSettled.mockClear();

    await screen.rerender(
      <StaticBoard
        fen={KINGS_AND_E5_PAWN}
        colors={colors}
        width={width}
        onSettled={onSettled}
      />,
    );
    // A frame in: there already.
    await settleAnimations(16);

    expect(onScreen(screen, 'e5')).toEqual({
      x: 4 * PIECE_WIDTH,
      y: 3 * PIECE_WIDTH,
    });
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('turns round at once when flipped, with nothing moving', async () => {
    const screen = await render(
      <StaticBoard
        fen={KINGS_AND_E4_PAWN}
        colors={colors}
        width={width}
        animate
      />,
    );

    await screen.rerender(
      <StaticBoard
        fen={KINGS_AND_E4_PAWN}
        colors={colors}
        width={width}
        orientation="b"
        animate
      />,
    );

    expect(onScreen(screen, 'e1')).toEqual({ x: 3 * PIECE_WIDTH, y: 0 });
  });
});
