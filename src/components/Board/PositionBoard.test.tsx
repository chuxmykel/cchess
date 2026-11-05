import { render } from '@testing-library/react-native';
import { DEFAULT_POSITION } from 'chess.js';

import PositionBoard from './PositionBoard';
import { boardTester } from './boardTester';
import { settleAnimations } from '../../testUtils/pieceGestures';

describe('PositionBoard', () => {
  const width = 400;
  const square = width / 8;
  const KINGS_AND_E4_PAWN = '4k3/8/8/8/4P3/8/8/4K3 w - - 0 1';
  const KINGS_AND_E5_PAWN = '4k3/8/8/4P3/8/8/8/4K3 b - - 0 1';

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  async function renderBoard(
    props: React.ComponentProps<typeof PositionBoard>,
  ) {
    const screen = await render(<PositionBoard {...props} />);
    return { screen, board: boardTester(screen, 'position') };
  }

  it('draws every piece in the position', async () => {
    const { board } = await renderBoard({ fen: DEFAULT_POSITION, width });

    expect(Object.keys(board.pieces())).toHaveLength(32);
    expect(board.pieceOn('e1')).toBe('wk');
    expect(board.size()).toBe(width);
  });

  it('places pieces on their squares from the given side', async () => {
    const fromWhite = await renderBoard({ fen: KINGS_AND_E4_PAWN, width });
    expect(fromWhite.board.pieceDrawnAt('e1')).toEqual({
      x: 4 * square,
      y: 7 * square,
    });

    const fromBlack = await renderBoard({
      fen: KINGS_AND_E4_PAWN,
      width,
      orientation: 'b',
    });
    expect(fromBlack.board.pieceDrawnAt('e1')).toEqual({ x: 3 * square, y: 0 });
  });

  it('slides a piece to its new square when animated', async () => {
    const onSettled = jest.fn();
    const { screen, board } = await renderBoard({
      fen: KINGS_AND_E4_PAWN,
      width,
      animate: true,
      onSettled,
    });
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
    const { y } = board.pieceDrawnAt('e5');
    expect(y).toBeLessThan(4 * square);
    expect(y).toBeGreaterThan(3 * square);
    expect(onSettled).not.toHaveBeenCalled();

    await settleAnimations();

    expect(board.pieceDrawnAt('e5')).toEqual(board.squareAt('e5'));
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('puts a piece straight on its new square when not animated', async () => {
    const onSettled = jest.fn();
    const { screen, board } = await renderBoard({
      fen: KINGS_AND_E4_PAWN,
      width,
      onSettled,
    });
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

    expect(board.pieceDrawnAt('e5')).toEqual(board.squareAt('e5'));
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('turns round at once when flipped, with nothing moving', async () => {
    const { screen, board } = await renderBoard({
      fen: KINGS_AND_E4_PAWN,
      width,
      animate: true,
    });

    await screen.rerender(
      <PositionBoard
        fen={KINGS_AND_E4_PAWN}
        width={width}
        orientation="b"
        animate
      />,
    );

    expect(board.pieceDrawnAt('e1')).toEqual({ x: 3 * square, y: 0 });
  });

  it('marks the move that led to the position', async () => {
    const { board } = await renderBoard({
      fen: KINGS_AND_E5_PAWN,
      width,
      lastMove: { from: 'e4', to: 'e5' },
    });

    expect(board.lastMove()).toEqual({ from: 'e4', to: 'e5' });
  });

  it('marks a mated king, tipped over', async () => {
    // Fool's mate, a move before and after.
    const before =
      'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2';
    const mate =
      'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';
    const { screen, board } = await renderBoard({ fen: before, width });
    expect(board.kingInDanger()).toBeNull();

    await screen.rerender(<PositionBoard fen={mate} width={width} />);
    await settleAnimations();

    expect(board.kingInDanger()).toEqual({ square: 'e1', fallen: true });
  });

  it("tips over the beaten side's king, however it lost", async () => {
    const { board } = await renderBoard({
      fen: KINGS_AND_E4_PAWN,
      width,
      defeated: 'b',
    });
    await settleAnimations();

    expect(board.kingInDanger()).toEqual({ square: 'e8', fallen: true });
  });
});
