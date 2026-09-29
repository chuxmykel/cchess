import { fireEvent, render } from '@testing-library/react-native';
import { Chess } from 'chess.js';
import Chessboard from '.';
import { buildPiecesFromGame, getXYFromSquare } from '../../utils';
import { NUMBER_OF_ROWS } from '../../constants';

describe("Chessboard", () => {
  const width = 400;
  const PIECE_WIDTH = width / NUMBER_OF_ROWS;

  async function renderChessBoard() {
    const mockOnMove = jest.fn();
    const screen = await render(
      <Chessboard
        game={new Chess()}
        colors={{
          dark: "black",
          light: "white"
        }}
        width={width}
        onMove={mockOnMove}
        pieces={[]}
      />
    );
    const result = screen.getByTestId("chessboard");
    return result;
  }

  async function renderChessBoardWithGame(game: Chess) {
    const onMove = jest.fn();
    const screen = await render(
      <Chessboard
        game={game}
        colors={{
          dark: "black",
          light: "white"
        }}
        width={width}
        onMove={onMove}
        pieces={buildPiecesFromGame(game, PIECE_WIDTH)}
      />
    );
    return { screen, onMove };
  }

  it("should exist", () => {
    expect(Chessboard).toBeDefined();
  });

  it("should be a perfect square", async () => {
    const result = await renderChessBoard();
    expect(result.props.style.width)
      .toEqual(result.props.style.height);
  });

  describe("click to move", () => {
    it("should move a piece when its square then an empty target square are tapped", async () => {
      const game = new Chess();
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-e2"));
      await fireEvent.press(screen.getByTestId("square-e4"));

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("e2", PIECE_WIDTH),
        getXYFromSquare("e4", PIECE_WIDTH),
      );
    });

    it("should deselect without moving when the same square is tapped twice", async () => {
      const game = new Chess();
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-e2"));
      await fireEvent.press(screen.getByTestId("square-e2"));

      expect(onMove).not.toHaveBeenCalled();
    });

    it("should switch selection when a different own piece is tapped", async () => {
      const game = new Chess();
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-e2")); // select the pawn
      await fireEvent.press(screen.getByTestId("square-b1")); // switch to the knight
      await fireEvent.press(screen.getByTestId("square-a3")); // legal knight move

      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("b1", PIECE_WIDTH),
        getXYFromSquare("a3", PIECE_WIDTH),
      );
    });

    it("should treat tapping an opponent-occupied square as the move's target", async () => {
      const game = new Chess();
      game.move("e4");
      game.move("d5");
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-e4"));
      await fireEvent.press(screen.getByTestId("square-d5"));

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("e4", PIECE_WIDTH),
        getXYFromSquare("d5", PIECE_WIDTH),
      );
    });

    it("should do nothing when an empty square is tapped with no selection", async () => {
      const game = new Chess();
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-e4"));

      expect(onMove).not.toHaveBeenCalled();
    });
  });
});

