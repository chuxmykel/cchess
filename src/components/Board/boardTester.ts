import { fireEvent, within } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { Color, Square } from 'chess.js';

import { animatedStyleOf } from '../../testUtils/animatedValue';
import { piecePositionOnScreen } from '../../testUtils/boardPosition';
import { dragPiece, touchPiece } from '../../testUtils/pieceGestures';

// Tests drive and read the app's boards through this, in a board's own terms
// - what stands on a square, a piece tapped or dragged from one square to
// another, the move marked - never the board library's testIDs or gestures,
// which only this file knows. Swapping the library means rewriting this file
// alongside the adapter, not the tests that use it.
//
// Drags run Gesture Handler's gestures through timed animations: tests that
// drag need jest.useFakeTimers().

export type BoardKind = 'game' | 'position' | 'setup' | 'empty';

// Each kind of board by the testID the adapter gives it.
const BOARD_TEST_IDS: Record<BoardKind, string> = {
  game: 'chessboard',
  position: 'static-chessboard',
  setup: 'editor-board',
  empty: 'empty-chessboard',
};

export type PieceCode = `${Color}${'p' | 'n' | 'b' | 'r' | 'q' | 'k'}`;
type Point = { x: number; y: number };

const TYPES = {
  pawn: 'p',
  knight: 'n',
  bishop: 'b',
  rook: 'r',
  queen: 'q',
  king: 'k',
} as const;

const FILES = 'abcdefgh';

const SQUARES = [8, 7, 6, 5, 4, 3, 2, 1].flatMap((rank) =>
  [...FILES].map((file) => `${file}${rank}` as Square),
);

type Element = ReturnType<ReturnType<typeof within>['getByTestId']>;
type Queries = Pick<ReturnType<typeof within>, 'getByTestId' | 'queryByTestId'>;

export function boardTester(
  screen: Queries,
  kind: BoardKind = 'game',
  // A board drawn but hidden - the earlier position under the live board.
  { includeHidden = false }: { includeHidden?: boolean } = {},
) {
  const testID = BOARD_TEST_IDS[kind];
  const root = () =>
    screen.getByTestId(testID, { includeHiddenElements: includeHidden });
  const board = () => within(root());
  const size = () => StyleSheet.flatten(root().props.style).width as number;
  const squareSize = () => size() / 8;
  const piecesLayer = () => board().getByTestId(`${testID}-pieces`);

  // Whose side is at the bottom: the pieces layer is turned round for black.
  function orientation(): Color {
    const steps = StyleSheet.flatten(piecesLayer().props.style).transform;
    return (steps ?? []).some(
      (step: Record<string, unknown>) => step.rotate === '180deg',
    )
      ? 'b'
      : 'w';
  }

  // A square's top-left corner on screen, from the board's.
  function squareAt(square: Square): Point {
    const file = FILES.indexOf(square[0]);
    const rank = Number(square[1]);
    const unit = squareSize();
    return orientation() === 'w'
      ? { x: file * unit, y: (8 - rank) * unit }
      : { x: (7 - file) * unit, y: (rank - 1) * unit };
  }

  function squareFrom(point: Point): Square {
    const unit = squareSize();
    const column = Math.round(point.x / unit);
    const row = Math.round(point.y / unit);
    return orientation() === 'w'
      ? (`${FILES[column]}${8 - row}` as Square)
      : (`${FILES[7 - column]}${row + 1}` as Square);
  }

  // The piece drawn on a square: not one a move has just taken, nor one a
  // drop has hidden.
  function pieceView(square: Square): Element | null {
    const view = board().queryByTestId(`piece-${square}`, {
      includeHiddenElements: includeHidden,
    });
    if (!view) return null;
    const opacity = animatedStyleOf(view)?.opacity;
    return opacity === 0 ? null : view;
  }

  function codeOf(view: Element): PieceCode {
    const [color, name] = (view.props.accessibilityLabel as string).split(' ');
    return `${color === 'white' ? 'w' : 'b'}${TYPES[name as keyof typeof TYPES]}`;
  }

  return {
    /** The board itself, to tell whether it's the same one as before. */
    element: root,
    /** Whether the board is shown, not drawn hidden. */
    isShown: () => screen.queryByTestId(testID) !== null,
    size,
    orientation,
    squareAt,

    /** The piece on a square, as 'wq', or null. */
    pieceOn(square: Square): PieceCode | null {
      const view = pieceView(square);
      return view ? codeOf(view) : null;
    },

    /** Every piece on the board, by its square. */
    pieces(): Partial<Record<Square, PieceCode>> {
      return Object.fromEntries(
        SQUARES.flatMap((square) => {
          const view = pieceView(square);
          return view ? [[square, codeOf(view)]] : [];
        }),
      );
    },

    /** Where the piece on a square is drawn: its top-left corner, on screen
     * from the board's. */
    pieceDrawnAt(square: Square): Point {
      return piecePositionOnScreen(
        board().getByTestId(`piece-${square}`),
        piecesLayer(),
        squareSize(),
      );
    },

    async tap(square: Square) {
      await fireEvent.press(board().getByTestId(`square-${square}`));
    },

    /** A tap on each square in turn - tap-to-move, two at a time. */
    async taps(...squares: Square[]) {
      for (const square of squares) {
        await fireEvent.press(board().getByTestId(`square-${square}`));
      }
    },

    /** The piece on `from` dragged and dropped on `to`. */
    async drag(from: Square, to: Square) {
      const start = squareAt(from);
      const end = squareAt(to);
      await dragPiece(`piece-${from}`, end.x - start.x, end.y - start.y);
    },

    /** The piece on a square dragged up and off the board. */
    async dragOff(square: Square) {
      const start = squareAt(square);
      await dragPiece(`piece-${square}`, 0, -(start.y + 2 * squareSize()));
    },

    /** A finger put down on a piece, and held. */
    async touch(square: Square) {
      await touchPiece(`piece-${square}`);
    },

    /** The squares shown as the selected or held piece's moves. */
    movesShown(): Square[] {
      return SQUARES.filter((square) => {
        const dot = board().queryByTestId(`valid-move-${square}`);
        return dot?.props.style.opacity === 1;
      });
    },

    /** The two squares marked for the last move. */
    lastMove(): { from: Square; to: Square } | null {
      const end = (which: 'from' | 'to') => {
        const view = board().queryByTestId(`last-move-${which}`);
        if (!view) return null;
        const { left, top } = StyleSheet.flatten(view.props.style);
        return squareFrom({ x: left as number, y: top as number });
      };
      const from = end('from');
      const to = end('to');
      return from && to ? { from, to } : null;
    },

    /** The king marked in danger, and whether it has fallen over. */
    kingInDanger(): { square: Square; fallen: boolean } | null {
      for (const square of SQUARES) {
        const view = pieceView(square);
        if (!view || !within(view).queryAllByTestId('danger-glow').length) {
          continue;
        }
        const sprite = within(view).getByTestId('sprite');
        const tilt = animatedStyleOf(sprite).transform[0].rotate;
        return { square, fallen: tilt !== '0deg' };
      }
      return null;
    },

    /** The arrows drawn over the board, each as 'e2e4'. */
    arrows(): string[] {
      return board()
        .queryAllByTestId(/^arrow-/)
        .map((arrow) => (arrow.props.testID as string).slice('arrow-'.length));
    },
  };
}

export type BoardTester = ReturnType<typeof boardTester>;
