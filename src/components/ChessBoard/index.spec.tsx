import { fireEvent, render } from '@testing-library/react-native';
import { Chess, Square } from 'chess.js';
import Chessboard from '.';
import { buildPiecesFromGame, getXYFromSquare } from '../../utils';
import { NUMBER_OF_ROWS } from '../../constants';
import { simulatePanResponderDrag, simulatePanResponderTap } from '../../testUtils/panResponderGesture';

describe("Chessboard", () => {
  const width = 400;
  const PIECE_WIDTH = width / NUMBER_OF_ROWS;

  function dragDeltaBetween(from: Square, to: Square) {
    const fromPosition = getXYFromSquare(from, PIECE_WIDTH);
    const toPosition = getXYFromSquare(to, PIECE_WIDTH);
    return { dx: toPosition.x - fromPosition.x, dy: toPosition.y - fromPosition.y };
  }

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

  describe("tap to move", () => {
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

      // Prove the tap didn't leave anything armed: a normal tap-to-move
      // sequence right after should behave exactly as it would on a fresh
      // board, not be affected by the earlier no-op tap in any way.
      await fireEvent.press(screen.getByTestId("square-e2"));
      await fireEvent.press(screen.getByTestId("square-e4"));

      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("e2", PIECE_WIDTH),
        getXYFromSquare("e4", PIECE_WIDTH),
      );
    });

    it("should call onMove with squares chess.js recognizes as a capture", async () => {
      const game = new Chess("4k3/8/8/8/8/2b5/8/1N2K3 w - - 0 1");
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-b1"));
      await fireEvent.press(screen.getByTestId("square-c3"));

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("b1", PIECE_WIDTH),
        getXYFromSquare("c3", PIECE_WIDTH),
      );

      const move = game.move({ from: "b1", to: "c3" });
      expect(move.captured).toBe("b");
      expect(move.isCapture()).toBe(true);
      expect(game.get("c3")).toEqual({ type: "n", color: "w" });
    });

    it("should not flag an ordinary move to an empty square as a capture", async () => {
      // Same position and piece as the capture test above, but moved to d2
      // (empty) instead of c3 (the bishop) - proves captured/flags actually
      // distinguish the two cases rather than the capture test passing
      // vacuously regardless of what chess.js reports. (The white king is in
      // check from the bishop here, so d2 - which blocks it - is the only
      // other legal square for this knight besides the capture on c3.)
      const game = new Chess("4k3/8/8/8/8/2b5/8/1N2K3 w - - 0 1");
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-b1"));
      await fireEvent.press(screen.getByTestId("square-d2"));

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("b1", PIECE_WIDTH),
        getXYFromSquare("d2", PIECE_WIDTH),
      );

      const move = game.move({ from: "b1", to: "d2" });
      expect(move.captured).toBeUndefined();
      expect(move.isCapture()).toBe(false);
    });

    it("should remove the captured piece from the board once the move is applied", async () => {
      const game = new Chess("r3k3/8/8/8/8/8/8/R3K3 w - - 0 1");
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-a1"));
      await fireEvent.press(screen.getByTestId("square-a8"));

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("a1", PIECE_WIDTH),
        getXYFromSquare("a8", PIECE_WIDTH),
      );

      game.move({ from: "a1", to: "a8" });
      const piecesAfterMove = buildPiecesFromGame(game, PIECE_WIDTH);
      expect(
        piecesAfterMove.find(piece => piece.square === "a8" && piece.color === "b")
      ).toBeUndefined();
      expect(
        piecesAfterMove.find(piece => piece.square === "a8" && piece.color === "w" && piece.type === "r")
      ).toBeDefined();
    });
  });

  describe("drag and drop", () => {
    it("should move a piece when dragged to an empty target square", async () => {
      const game = new Chess();
      const { screen, onMove } = await renderChessBoardWithGame(game);
      const { dx, dy } = dragDeltaBetween("e2", "e4");

      await simulatePanResponderDrag(screen.getByTestId("piece-e2"), dx, dy);

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("e2", PIECE_WIDTH),
        getXYFromSquare("e4", PIECE_WIDTH),
      );
    });

    it("should call onMove with squares chess.js recognizes as a capture when dragged onto an opponent's piece", async () => {
      const game = new Chess("4k3/8/8/8/8/2b5/8/1N2K3 w - - 0 1");
      const { screen, onMove } = await renderChessBoardWithGame(game);
      const { dx, dy } = dragDeltaBetween("b1", "c3");

      await simulatePanResponderDrag(screen.getByTestId("piece-b1"), dx, dy);

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("b1", PIECE_WIDTH),
        getXYFromSquare("c3", PIECE_WIDTH),
      );

      const move = game.move({ from: "b1", to: "c3" });
      expect(move.captured).toBe("b");
      expect(move.isCapture()).toBe(true);
    });

    it("should castle kingside for white when the king is dragged two squares", async () => {
      const game = new Chess("r1bqk2r/pppp1ppp/2n2n2/2b1p1N1/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 6 5");
      const { screen, onMove } = await renderChessBoardWithGame(game);
      const { dx, dy } = dragDeltaBetween("e1", "g1");

      await simulatePanResponderDrag(screen.getByTestId("piece-e1"), dx, dy);

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("e1", PIECE_WIDTH),
        getXYFromSquare("g1", PIECE_WIDTH),
      );

      const move = game.move({ from: "e1", to: "g1" });
      expect(move.isKingsideCastle()).toBe(true);
    });

    it("should capture en passant when dragged through the capturing move", async () => {
      const game = new Chess();
      game.move("e4");
      game.move("a6");
      game.move("e5");
      game.move("d5");
      const { screen, onMove } = await renderChessBoardWithGame(game);
      const { dx, dy } = dragDeltaBetween("e5", "d6");

      await simulatePanResponderDrag(screen.getByTestId("piece-e5"), dx, dy);

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("e5", PIECE_WIDTH),
        getXYFromSquare("d6", PIECE_WIDTH),
      );

      const move = game.move({ from: "e5", to: "d6" });
      expect(move.isEnPassant()).toBe(true);
      expect(move.captured).toBe("p");
    });

    it("should not move an opponent's piece even if dragged", async () => {
      const game = new Chess(); // white to move
      const { screen, onMove } = await renderChessBoardWithGame(game);
      const { dx, dy } = dragDeltaBetween("e7", "e5");

      await simulatePanResponderDrag(screen.getByTestId("piece-e7"), dx, dy);

      expect(onMove).not.toHaveBeenCalled();
    });

    it("should select the square (not move) when a piece is tapped through the drag responder without real movement", async () => {
      const game = new Chess();
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await simulatePanResponderTap(screen.getByTestId("piece-e2"));
      await fireEvent.press(screen.getByTestId("square-e4"));

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("e2", PIECE_WIDTH),
        getXYFromSquare("e4", PIECE_WIDTH),
      );
    });
  });

  describe("mixed tap and drag interactions", () => {
    it("should not leave a stale tap-selection armed after an unrelated illegal drag", async () => {
      const game = new Chess();
      const { screen, onMove } = await renderChessBoardWithGame(game);

      // Tap e2 to select the white pawn.
      await fireEvent.press(screen.getByTestId("square-e2"));

      // Drag a different piece (the c1 bishop) onto its own pawn at c2 - an
      // illegal target. Chessboard has no legality opinion of its own (that's
      // Game's handleMove, one layer up), so this drag legitimately calls
      // onMove(c1, c2) same as any other drag; it's the caller's job to
      // reject it. What matters is that the gesture still invalidates the
      // earlier e2 tap-selection.
      const { dx, dy } = dragDeltaBetween("c1", "c2");
      await simulatePanResponderDrag(screen.getByTestId("piece-c1"), dx, dy);
      onMove.mockClear();

      // Tapping an empty square now, with nothing actually selected anymore,
      // must be a no-op - NOT silently move the e2 pawn there.
      await fireEvent.press(screen.getByTestId("square-e4"));

      expect(onMove).not.toHaveBeenCalled();
    });

    it("should let a fresh tap select a new piece after an unrelated illegal drag", async () => {
      const game = new Chess();
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-e2"));

      const { dx, dy } = dragDeltaBetween("c1", "c2");
      await simulatePanResponderDrag(screen.getByTestId("piece-c1"), dx, dy);

      // A fresh, deliberate tap-to-move sequence afterward should work normally.
      await fireEvent.press(screen.getByTestId("square-d2"));
      await fireEvent.press(screen.getByTestId("square-d4"));

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("d2", PIECE_WIDTH),
        getXYFromSquare("d4", PIECE_WIDTH),
      );
    });
  });

  describe("accurate piece movement", () => {
    it("moves a pawn forward from an edge file", async () => {
      const game = new Chess();
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-a2"));
      await fireEvent.press(screen.getByTestId("square-a4"));

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("a2", PIECE_WIDTH),
        getXYFromSquare("a4", PIECE_WIDTH),
      );
    });

    it("moves a black pawn forward", async () => {
      const game = new Chess();
      game.move("e4");
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-e7"));
      await fireEvent.press(screen.getByTestId("square-e5"));

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("e7", PIECE_WIDTH),
        getXYFromSquare("e5", PIECE_WIDTH),
      );
    });

    it("moves a knight toward an edge square", async () => {
      const game = new Chess();
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-g1"));
      await fireEvent.press(screen.getByTestId("square-h3"));

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("g1", PIECE_WIDTH),
        getXYFromSquare("h3", PIECE_WIDTH),
      );
    });

    it("moves a bishop along the long diagonal between corners", async () => {
      const game = new Chess("4k3/7p/8/8/8/8/8/B3K3 w - - 0 1");
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-a1"));
      await fireEvent.press(screen.getByTestId("square-h8"));

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("a1", PIECE_WIDTH),
        getXYFromSquare("h8", PIECE_WIDTH),
      );
    });

    it("moves a rook the length of a file between corners", async () => {
      const game = new Chess("4k3/8/8/8/8/8/8/R3K3 w - - 0 1");
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-a1"));
      await fireEvent.press(screen.getByTestId("square-a8"));

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("a1", PIECE_WIDTH),
        getXYFromSquare("a8", PIECE_WIDTH),
      );
    });

    it("moves a queen diagonally toward an edge file", async () => {
      const game = new Chess("4k3/8/8/8/8/8/8/3QK3 w - - 0 1");
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-d1"));
      await fireEvent.press(screen.getByTestId("square-a4"));

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("d1", PIECE_WIDTH),
        getXYFromSquare("a4", PIECE_WIDTH),
      );
    });

    it("moves a king one square from a corner", async () => {
      const game = new Chess("4k3/7p/8/8/8/8/8/K7 w - - 0 1");
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-a1"));
      await fireEvent.press(screen.getByTestId("square-b2"));

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("a1", PIECE_WIDTH),
        getXYFromSquare("b2", PIECE_WIDTH),
      );
    });
  });

  describe("castling", () => {
    it("should castle kingside for white", async () => {
      const game = new Chess("r1bqk2r/pppp1ppp/2n2n2/2b1p1N1/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 6 5");
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-e1"));
      await fireEvent.press(screen.getByTestId("square-g1"));

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("e1", PIECE_WIDTH),
        getXYFromSquare("g1", PIECE_WIDTH),
      );

      const move = game.move({ from: "e1", to: "g1" });
      expect(move.isKingsideCastle()).toBe(true);
    });

    it("should castle kingside for black", async () => {
      const game = new Chess("r1bqk2r/pppp1ppp/2n2n2/2b1p1N1/2B1P3/8/PPPP1PPP/RNBQK2R b KQkq - 6 5");
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-e8"));
      await fireEvent.press(screen.getByTestId("square-g8"));

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("e8", PIECE_WIDTH),
        getXYFromSquare("g8", PIECE_WIDTH),
      );

      const move = game.move({ from: "e8", to: "g8" });
      expect(move.isKingsideCastle()).toBe(true);
    });

    it("should castle queenside for white", async () => {
      const game = new Chess("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R3KBNR w KQkq - 0 1");
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-e1"));
      await fireEvent.press(screen.getByTestId("square-c1"));

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("e1", PIECE_WIDTH),
        getXYFromSquare("c1", PIECE_WIDTH),
      );

      const move = game.move({ from: "e1", to: "c1" });
      expect(move.isQueensideCastle()).toBe(true);
    });

    it("should castle queenside for black", async () => {
      const game = new Chess("r3kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1");
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-e8"));
      await fireEvent.press(screen.getByTestId("square-c8"));

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("e8", PIECE_WIDTH),
        getXYFromSquare("c8", PIECE_WIDTH),
      );

      const move = game.move({ from: "e8", to: "c8" });
      expect(move.isQueensideCastle()).toBe(true);
    });
  });

  describe("en passant", () => {
    it("should capture en passant when tapping through the capturing move", async () => {
      const game = new Chess();
      game.move("e4");
      game.move("a6");
      game.move("e5");
      game.move("d5");
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-e5"));
      await fireEvent.press(screen.getByTestId("square-d6"));

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("e5", PIECE_WIDTH),
        getXYFromSquare("d6", PIECE_WIDTH),
      );

      const move = game.move({ from: "e5", to: "d6" });
      expect(move.isEnPassant()).toBe(true);
      expect(move.captured).toBe("p");
      expect(game.get("d5")).toBeUndefined();
    });
  });

  describe("promotion", () => {
    it("should call onMove for a pawn move that reaches the back rank", async () => {
      const game = new Chess("8/4P3/8/2k5/8/4K3/8/8 w - - 0 1");
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-e7"));
      await fireEvent.press(screen.getByTestId("square-e8"));

      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("e7", PIECE_WIDTH),
        getXYFromSquare("e8", PIECE_WIDTH),
      );

      const legalMoves = game.moves({ square: "e7", verbose: true });
      expect(legalMoves.length).toBeGreaterThan(0);
      expect(legalMoves.every(move => move.to === "e8" && move.isPromotion())).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should not call onMove when the game is already over", async () => {
      const game = new Chess();
      game.move("f3");
      game.move("e5");
      game.move("g4");
      game.move("Qh4");
      expect(game.isGameOver()).toBe(true);

      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-e8"));
      await fireEvent.press(screen.getByTestId("square-e7"));

      expect(onMove).not.toHaveBeenCalled();
    });

    it("should not crash through a chain of select/deselect/reselect taps", async () => {
      const game = new Chess();
      const { screen, onMove } = await renderChessBoardWithGame(game);

      await fireEvent.press(screen.getByTestId("square-e2")); // select pawn
      await fireEvent.press(screen.getByTestId("square-e2")); // deselect
      await fireEvent.press(screen.getByTestId("square-d2")); // select another pawn
      await fireEvent.press(screen.getByTestId("square-b1")); // switch to knight
      await fireEvent.press(screen.getByTestId("square-b1")); // deselect
      await fireEvent.press(screen.getByTestId("square-g1")); // select other knight
      await fireEvent.press(screen.getByTestId("square-f3")); // legal move

      expect(onMove).toHaveBeenCalledTimes(1);
      expect(onMove).toHaveBeenCalledWith(
        getXYFromSquare("g1", PIECE_WIDTH),
        getXYFromSquare("f3", PIECE_WIDTH),
      );
    });
  });
});

