import { fireEvent, render } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Color } from 'chess.js';

import GameBoard from './GameBoard';
import { boardTester } from './boardTester';
import PromotionMenu from '../PromotionMenu';
import {
  ChessGameProvider,
  useChessGameContext,
} from '../../context/ChessGameContext';
import { settleAnimations } from '../../testUtils/pieceGestures';

// The board playing a real game (useChessGame), driven and read through
// boardTester - in the board's own terms, so these hold whatever library
// draws it. How the library itself draws and moves pieces is tested in
// src/lib/chessboard.
describe('GameBoard', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const width = 400;

  // Every gameplay behavior below is run from both sides of the board:
  // orientation only changes where squares are drawn, so taps and drags must
  // land on the same squares either way.
  const PERSPECTIVES = [
    { name: 'white', orientation: 'w' },
    { name: 'black', orientation: 'b' },
  ] as const;

  function PromotionMenuForTest() {
    const { turn, pendingPromotion, promoteTo } = useChessGameContext();
    if (!pendingPromotion) return null;
    return (
      <PromotionMenu
        promotingColor={turn}
        boardWidth={width}
        pieceWidth={width / 8}
        handlePromotion={promoteTo}
      />
    );
  }

  function boardTree(
    fen?: string,
    orientation?: Color,
    props: Partial<React.ComponentProps<typeof GameBoard>> = {},
  ) {
    return (
      <GestureHandlerRootView>
        <ChessGameProvider fen={fen}>
          <GameBoard width={width} orientation={orientation} {...props} />
          <PromotionMenuForTest />
        </ChessGameProvider>
      </GestureHandlerRootView>
    );
  }

  async function renderBoard(
    fen?: string,
    orientation?: Color,
    props?: Partial<React.ComponentProps<typeof GameBoard>>,
  ) {
    const screen = await render(boardTree(fen, orientation, props));
    return { screen, board: boardTester(screen) };
  }

  it('draws the game at the size given', async () => {
    const { board } = await renderBoard();

    expect(board.size()).toBe(width);
    expect(Object.keys(board.pieces())).toHaveLength(32);
    expect(board.pieceOn('e1')).toBe('wk');
    expect(board.pieceOn('d8')).toBe('bq');
  });

  describe('last move', () => {
    it('marks no move before one is played', async () => {
      const { board } = await renderBoard();

      expect(board.lastMove()).toBeNull();
    });

    it('marks the move just made', async () => {
      const { board } = await renderBoard();

      await board.taps('e2', 'e4');

      expect(board.lastMove()).toEqual({ from: 'e2', to: 'e4' });
    });

    it("marks the game's last move until the board makes one, as on a game resumed", async () => {
      const { board } = await renderBoard(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
        'w',
        { lastPlayedMove: { from: 'e2', to: 'e4', piece: 'p' } },
      );
      expect(board.lastMove()).toEqual({ from: 'e2', to: 'e4' });

      await board.taps('e7', 'e5');

      expect(board.lastMove()).toEqual({ from: 'e7', to: 'e5' });
    });

    it("marks the king's and rook's starting squares for a castle", async () => {
      const { board } = await renderBoard(
        'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
      );

      await board.taps('e1', 'c1');

      expect(board.lastMove()).toEqual({ from: 'e1', to: 'a1' });
    });
  });

  describe('a king in danger', () => {
    it('marks the king in check', async () => {
      const { board } = await renderBoard('4k3/8/8/8/8/8/8/R3K3 w - - 0 1');

      await board.taps('a1', 'a8');

      expect(board.kingInDanger()).toEqual({ square: 'e8', fallen: false });
    });

    it('tips over the king of the side that lost', async () => {
      const { board } = await renderBoard(undefined, 'w', { defeated: 'b' });
      await settleAnimations();

      expect(board.kingInDanger()).toEqual({ square: 'e8', fallen: true });
    });
  });

  describe('tap to move', () => {
    describe.each(PERSPECTIVES)(
      "from $name's perspective",
      ({ orientation }) => {
        it('moves a piece when its square then an empty target square are tapped', async () => {
          const { board } = await renderBoard(undefined, orientation);

          await board.taps('e2', 'e4');

          expect(board.pieceOn('e2')).toBeNull();
          expect(board.pieceOn('e4')).toBe('wp');
        });

        it("shows a selected piece's moves", async () => {
          const { board } = await renderBoard(undefined, orientation);

          await board.tap('g1');

          expect(board.movesShown().sort()).toEqual(['f3', 'h3']);
        });

        it('keeps the selection when the same square is tapped twice', async () => {
          const { board } = await renderBoard(undefined, orientation);

          await board.taps('e2', 'e2', 'e4');

          expect(board.pieceOn('e4')).toBe('wp');
        });

        it('switches selection when a different own piece is tapped', async () => {
          const { board } = await renderBoard(undefined, orientation);

          await board.taps('e2', 'b1', 'a3');

          expect(board.pieceOn('a3')).toBe('wn');
          expect(board.pieceOn('e2')).toBe('wp');
        });

        it("treats tapping an opponent-occupied square as the move's target", async () => {
          const { board } = await renderBoard(undefined, orientation);
          await board.taps('e2', 'e4', 'd7', 'd5');

          await board.taps('e4', 'd5');

          expect(board.pieceOn('e4')).toBeNull();
          expect(board.pieceOn('d5')).toBe('wp');
        });

        it('does nothing when an empty square is tapped with no selection', async () => {
          const { board } = await renderBoard(undefined, orientation);

          await board.tap('e4');
          // Nothing left armed: a tap-to-move right after works as on a
          // fresh board.
          await board.taps('e2', 'e4');

          expect(board.pieceOn('e4')).toBe('wp');
        });

        it('takes the piece captured off the board', async () => {
          const { board } = await renderBoard(
            'r3k3/8/8/8/8/8/8/R3K3 w - - 0 1',
            orientation,
          );

          await board.taps('a1', 'a8');
          await settleAnimations();

          expect(board.pieceOn('a8')).toBe('wr');
          expect(Object.keys(board.pieces())).toHaveLength(3);
        });
      },
    );
  });

  describe('drag and drop', () => {
    describe.each(PERSPECTIVES)(
      "from $name's perspective",
      ({ orientation }) => {
        it('moves a piece dragged to an empty target square', async () => {
          const { board } = await renderBoard(undefined, orientation);

          await board.drag('e2', 'e4');

          expect(board.pieceOn('e2')).toBeNull();
          expect(board.pieceOn('e4')).toBe('wp');
        });

        it('shows a piece that later lands where a drop took one', async () => {
          // d4xe5 dropped, then d6xe5 back.
          const { board } = await renderBoard(
            '4k3/8/3p4/4p3/3P4/8/8/4K3 w - - 0 1',
            orientation,
          );

          await board.drag('d4', 'e5');
          await board.taps('d6', 'e5');
          await settleAnimations();

          expect(board.pieceOn('d6')).toBeNull();
          expect(board.pieceOn('e5')).toBe('bp');
        });

        it("doesn't move an opponent's piece, even dragged", async () => {
          const { board } = await renderBoard(undefined, orientation);

          await board.drag('e7', 'e5');

          expect(board.pieceOn('e7')).toBe('bp');
          expect(board.pieceOn('e5')).toBeNull();
        });

        it('puts a piece back on its square when dragged off the board', async () => {
          const { board } = await renderBoard(undefined, orientation);

          await board.dragOff('g1');

          expect(board.pieceOn('g1')).toBe('wn');
          expect(board.pieceDrawnAt('g1')).toEqual(board.squareAt('g1'));
        });

        it("shows a piece's moves as soon as it's touched", async () => {
          const { board } = await renderBoard(undefined, orientation);

          await board.touch('e2');

          expect(board.movesShown().sort()).toEqual(['e3', 'e4']);
        });
      },
    );
  });

  describe('mixed tap and drag interactions', () => {
    describe.each(PERSPECTIVES)(
      "from $name's perspective",
      ({ orientation }) => {
        it("doesn't leave a tap selection armed after an unrelated illegal drag", async () => {
          const { board } = await renderBoard(undefined, orientation);

          await board.tap('e2');
          await board.drag('c1', 'c2');
          // Nothing selected now: no move.
          await board.tap('e4');

          expect(board.pieceOn('e2')).toBe('wp');
          expect(board.pieceOn('e4')).toBeNull();
        });

        it('lets a fresh tap select a new piece after an unrelated illegal drag', async () => {
          const { board } = await renderBoard(undefined, orientation);

          await board.tap('e2');
          await board.drag('c1', 'c2');
          await board.taps('d2', 'd4');

          expect(board.pieceOn('d4')).toBe('wp');
        });
      },
    );
  });

  describe('castling', () => {
    describe.each(PERSPECTIVES)(
      "from $name's perspective",
      ({ orientation }) => {
        it('castles kingside for white, moving the rook too', async () => {
          const { board } = await renderBoard(
            'r1bqk2r/pppp1ppp/2n2n2/2b1p1N1/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 6 5',
            orientation,
          );

          await board.taps('e1', 'g1');

          expect(board.pieceOn('g1')).toBe('wk');
          expect(board.pieceOn('f1')).toBe('wr');
          expect(board.pieceOn('h1')).toBeNull();
        });

        it('castles queenside for black by drag, moving the rook too', async () => {
          const { board } = await renderBoard(
            'r3kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1',
            orientation,
          );

          await board.drag('e8', 'c8');

          expect(board.pieceOn('c8')).toBe('bk');
          expect(board.pieceOn('d8')).toBe('br');
          expect(board.pieceOn('a8')).toBeNull();
        });
      },
    );
  });

  describe('en passant', () => {
    describe.each(PERSPECTIVES)(
      "from $name's perspective",
      ({ orientation }) => {
        it('captures en passant, taking the pawn passed', async () => {
          const { board } = await renderBoard(undefined, orientation);
          await board.taps('e2', 'e4', 'a7', 'a6', 'e4', 'e5', 'd7', 'd5');

          await board.taps('e5', 'd6');
          await settleAnimations();

          expect(board.pieceOn('d6')).toBe('wp');
          expect(board.pieceOn('d5')).toBeNull();
        });
      },
    );
  });

  describe('promotion', () => {
    describe.each(PERSPECTIVES)(
      "from $name's perspective",
      ({ orientation }) => {
        it('asks for the piece, then promotes to it', async () => {
          const { screen, board } = await renderBoard(
            '8/4P3/8/2k5/8/4K3/8/8 w - - 0 1',
            orientation,
          );

          await board.taps('e7', 'e8');

          expect(board.pieceOn('e7')).toBe('wp');
          expect(board.pieceOn('e8')).toBeNull();

          await fireEvent.press(screen.getByTestId('promote-n'));

          expect(board.pieceOn('e7')).toBeNull();
          expect(board.pieceOn('e8')).toBe('wn');
          expect(screen.queryByTestId('promote-n')).toBeNull();
        });
      },
    );
  });

  describe('edge cases', () => {
    describe.each(PERSPECTIVES)(
      "from $name's perspective",
      ({ orientation }) => {
        it('allows no moves once the game is over', async () => {
          const { board } = await renderBoard(undefined, orientation);
          // Fool's mate.
          await board.taps('f2', 'f3', 'e7', 'e5', 'g2', 'g4', 'd8', 'h4');

          await board.taps('e8', 'e7');

          expect(board.pieceOn('e8')).toBe('bk');
          expect(board.pieceOn('e7')).toBeNull();
        });

        it('survives a chain of select, re-tap and reselect taps', async () => {
          const { board } = await renderBoard(undefined, orientation);

          await board.taps('e2', 'e2', 'd2', 'b1', 'b1', 'g1', 'f3');

          expect(board.pieceOn('f3')).toBe('wn');
          expect(board.pieceOn('e2')).toBe('wp');
          expect(board.pieceOn('d2')).toBe('wp');
          expect(board.pieceOn('b1')).toBe('wn');
        });
      },
    );
  });

  describe('board orientation', () => {
    describe.each([
      { name: 'white', orientation: 'w', bottomLeft: 'a1', topRight: 'h8' },
      { name: 'black', orientation: 'b', bottomLeft: 'h8', topRight: 'a1' },
    ] as const)(
      "from $name's perspective",
      ({ orientation, bottomLeft, topRight }) => {
        it(`draws ${bottomLeft} at the bottom-left and ${topRight} at the top-right`, async () => {
          const { board } = await renderBoard(undefined, orientation);
          const square = width / 8;

          expect(board.pieceDrawnAt(bottomLeft)).toEqual({
            x: 0,
            y: 7 * square,
          });
          expect(board.pieceDrawnAt(topRight)).toEqual({ x: 7 * square, y: 0 });
        });

        it('turns every piece round at once when flipped to this side', async () => {
          const other = orientation === 'w' ? 'b' : 'w';
          const { screen, board } = await renderBoard(undefined, other);

          await screen.rerender(boardTree(undefined, orientation));

          // In the same render as the squares - not a frame later.
          expect(board.orientation()).toBe(orientation);
          expect(board.pieceDrawnAt('e2')).toEqual(board.squareAt('e2'));
        });
      },
    );
  });
});
