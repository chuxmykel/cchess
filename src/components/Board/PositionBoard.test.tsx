import { render, within } from '@testing-library/react-native';
import { DEFAULT_POSITION } from 'chess.js';

import PositionBoard from './PositionBoard';
import { NUMBER_OF_ROWS } from '../../constants';
import { piecePositionOnScreen } from '../../testUtils/boardPosition';
import { settleAnimations } from '../../testUtils/pieceGestures';
import { animatedStyleOf } from '../../testUtils/animatedValue';

describe('PositionBoard', () => {
  const width = 400;
  const PIECE_WIDTH = width / NUMBER_OF_ROWS;
  const KINGS_AND_E4_PAWN = '4k3/8/8/8/4P3/8/8/4K3 w - - 0 1';
  const KINGS_AND_E5_PAWN = '4k3/8/8/4P3/8/8/8/4K3 b - - 0 1';

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  type Screen = Awaited<ReturnType<typeof render>>;

  // Where the piece on this square is drawn on screen.
  function onScreen(screen: Screen, square: string) {
    return piecePositionOnScreen(
      screen.getByTestId(`piece-${square}`),
      screen.getByTestId('static-chessboard-pieces'),
      PIECE_WIDTH,
    );
  }

  it('draws every piece in the position, and nothing can touch them', async () => {
    const screen = await render(
      <PositionBoard fen={DEFAULT_POSITION} width={width} />,
    );

    expect(screen.getAllByTestId(/^piece-/)).toHaveLength(32);
    expect(screen.getAllByTestId('chessboard-row')).toHaveLength(8);
    expect(screen.getByTestId('static-chessboard')).toHaveProp(
      'pointerEvents',
      'none',
    );
  });

  it('places pieces on their squares from the given side', async () => {
    const fromWhite = await render(
      <PositionBoard fen={KINGS_AND_E4_PAWN} width={width} />,
    );
    expect(onScreen(fromWhite, 'e1')).toEqual({
      x: 4 * PIECE_WIDTH,
      y: 7 * PIECE_WIDTH,
    });

    const fromBlack = await render(
      <PositionBoard fen={KINGS_AND_E4_PAWN} width={width} orientation="b" />,
    );
    expect(onScreen(fromBlack, 'e1')).toEqual({ x: 3 * PIECE_WIDTH, y: 0 });
  });

  it('moves the same piece to its new square, rather than drawing a new one', async () => {
    const screen = await render(
      <PositionBoard fen={KINGS_AND_E4_PAWN} width={width} />,
    );
    const whiteKing = screen.getByTestId('piece-e1');
    const pawn = screen.getByTestId('piece-e4');

    await screen.rerender(
      <PositionBoard fen={KINGS_AND_E5_PAWN} width={width} />,
    );

    expect(screen.getByTestId('piece-e1')).toBe(whiteKing);
    expect(screen.getByTestId('piece-e5')).toBe(pawn);
    expect(screen.queryByTestId('piece-e4')).toBeNull();
  });

  it('slides a piece to its new square when animated', async () => {
    const onSettled = jest.fn();
    const screen = await render(
      <PositionBoard
        fen={KINGS_AND_E4_PAWN}
        width={width}
        animate
        onSettled={onSettled}
      />,
    );
    onSettled.mockClear();

    await screen.rerender(
      <PositionBoard
        fen={KINGS_AND_E5_PAWN}
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
      <PositionBoard
        fen={KINGS_AND_E4_PAWN}
        width={width}
        onSettled={onSettled}
      />,
    );
    onSettled.mockClear();

    await screen.rerender(
      <PositionBoard
        fen={KINGS_AND_E5_PAWN}
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
      <PositionBoard fen={KINGS_AND_E4_PAWN} width={width} animate />,
    );

    await screen.rerender(
      <PositionBoard
        fen={KINGS_AND_E4_PAWN}
        width={width}
        orientation="b"
        animate
      />,
    );

    expect(onScreen(screen, 'e1')).toEqual({ x: 3 * PIECE_WIDTH, y: 0 });
  });

  it('marks the move that led to the position', async () => {
    const screen = await render(
      <PositionBoard
        fen={KINGS_AND_E5_PAWN}
        width={width}
        lastMove={{ from: 'e4', to: 'e5' }}
      />,
    );

    expect(screen.getByTestId('last-move-from')).toHaveStyle({
      left: 4 * PIECE_WIDTH,
      top: 4 * PIECE_WIDTH,
    });
    expect(screen.getByTestId('last-move-to')).toHaveStyle({
      left: 4 * PIECE_WIDTH,
      top: 3 * PIECE_WIDTH,
    });
  });

  // How far a king's image is tipped over.
  function tilt(screen: Screen, square: string) {
    const sprite = within(screen.getByTestId(`piece-${square}`)).getByTestId(
      'sprite',
    );
    return animatedStyleOf(sprite).transform[0].rotate;
  }

  it('makes a mated king glow, and tips it over', async () => {
    // Fool's mate, a move before and after.
    const before =
      'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2';
    const mate =
      'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';
    const screen = await render(<PositionBoard fen={before} width={width} />);
    expect(screen.queryByTestId('danger-glow')).toBeNull();

    await screen.rerender(<PositionBoard fen={mate} width={width} />);
    await settleAnimations();

    const king = within(screen.getByTestId('piece-e1'));
    expect(king.getByTestId('danger-glow')).toBeTruthy();
    expect(tilt(screen, 'e1')).toBe('45deg');
    expect(
      within(screen.getByTestId('piece-e8')).queryByTestId('danger-glow'),
    ).toBeNull();
  });

  it("tips over the beaten side's king, however it lost", async () => {
    const screen = await render(
      <PositionBoard fen={KINGS_AND_E4_PAWN} width={width} defeated="b" />,
    );
    await settleAnimations();

    const king = within(screen.getByTestId('piece-e8'));
    expect(king.getByTestId('danger-glow')).toBeTruthy();
    expect(tilt(screen, 'e8')).toBe('45deg');
    expect(tilt(screen, 'e1')).toBe('0deg');
  });
});
