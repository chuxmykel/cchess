import { fireEvent, render } from "@testing-library/react-native";
import Chessboard from ".";
import PromotionMenu from "../PromotionMenu";
import {
  ChessGameProvider,
  useChessGameContext,
} from "../../screens/Game/ChessGameContext";
import { getXYFromSquare } from "../../domain/boardCoordinates";
import { NUMBER_OF_ROWS } from "../../constants";
import {
  simulatePanResponderDrag,
  simulatePanResponderGrant,
  simulatePanResponderTap,
} from "../../testUtils/panResponderGesture";

describe("Chessboard", () => {
  const width = 400;
  const PIECE_WIDTH = width / NUMBER_OF_ROWS;

  function dragDeltaBetween(from: string, to: string) {
    const fromPosition = getXYFromSquare(from, PIECE_WIDTH);
    const toPosition = getXYFromSquare(to, PIECE_WIDTH);
    return {
      dx: toPosition.x - fromPosition.x,
      dy: toPosition.y - fromPosition.y,
    };
  }

  function PromotionMenuForTest() {
    const { turn, pendingPromotion, promoteTo } = useChessGameContext();
    if (!pendingPromotion) return null;
    return (
      <PromotionMenu
        promotingColor={turn}
        boardWidth={width}
        pieceWidth={PIECE_WIDTH}
        handlePromotion={promoteTo}
      />
    );
  }

  async function renderChessBoard(fen?: string) {
    return render(
      <ChessGameProvider fen={fen}>
        <Chessboard colors={{ dark: "black", light: "white" }} width={width} />
        <PromotionMenuForTest />
      </ChessGameProvider>,
    );
  }

  it("should exist", () => {
    expect(Chessboard).toBeDefined();
  });

  it("should be a perfect square", async () => {
    const screen = await renderChessBoard();
    const result = screen.getByTestId("chessboard");
    expect(result.props.style.width).toEqual(result.props.style.height);
  });

  it("should not render the drag-and-drop guide visibly before any gesture", async () => {
    const screen = await renderChessBoard();

    expect(screen.getByTestId("drag-guide").props.style.opacity).toBe(0);
  });

  describe("tap to move", () => {
    it("should move a piece when its square then an empty target square are tapped", async () => {
      const screen = await renderChessBoard();

      await fireEvent.press(screen.getByTestId("square-e2"));
      await fireEvent.press(screen.getByTestId("square-e4"));

      expect(screen.queryByTestId("piece-e2")).toBeNull();
      expect(screen.getByTestId("piece-e4")).toBeTruthy();
    });

    it("should keep the selection (no-op) when the same square is tapped twice", async () => {
      const screen = await renderChessBoard();

      await fireEvent.press(screen.getByTestId("square-e2"));
      await fireEvent.press(screen.getByTestId("square-e2"));
      expect(screen.getByTestId("piece-e2")).toBeTruthy();

      await fireEvent.press(screen.getByTestId("square-e4"));

      expect(screen.getByTestId("piece-e4")).toBeTruthy();
    });

    it("should switch selection when a different own piece is tapped", async () => {
      const screen = await renderChessBoard();

      await fireEvent.press(screen.getByTestId("square-e2")); // select the pawn
      await fireEvent.press(screen.getByTestId("square-b1")); // switch to the knight
      await fireEvent.press(screen.getByTestId("square-a3")); // legal knight move

      expect(screen.getByTestId("piece-a3")).toBeTruthy();
      expect(screen.getByTestId("piece-e2")).toBeTruthy(); // the pawn never moved
    });

    it("should treat tapping an opponent-occupied square as the move's target", async () => {
      const screen = await renderChessBoard();
      await fireEvent.press(screen.getByTestId("square-e2"));
      await fireEvent.press(screen.getByTestId("square-e4"));
      await fireEvent.press(screen.getByTestId("square-d7"));
      await fireEvent.press(screen.getByTestId("square-d5"));

      await fireEvent.press(screen.getByTestId("square-e4"));
      await fireEvent.press(screen.getByTestId("square-d5"));

      expect(screen.queryByTestId("piece-e4")).toBeNull();
      expect(screen.getByTestId("piece-d5")).toBeTruthy();
    });

    it("should do nothing when an empty square is tapped with no selection", async () => {
      const screen = await renderChessBoard();

      await fireEvent.press(screen.getByTestId("square-e4"));

      // Prove the tap didn't leave anything armed: a normal tap-to-move
      // sequence right after should behave exactly as it would on a fresh
      // board, not be affected by the earlier no-op tap in any way.
      await fireEvent.press(screen.getByTestId("square-e2"));
      await fireEvent.press(screen.getByTestId("square-e4"));

      expect(screen.getByTestId("piece-e4")).toBeTruthy();
    });

    it("should remove the captured piece from the board once the move is applied", async () => {
      const screen = await renderChessBoard("r3k3/8/8/8/8/8/8/R3K3 w - - 0 1");

      await fireEvent.press(screen.getByTestId("square-a1"));
      await fireEvent.press(screen.getByTestId("square-a8"));

      expect(screen.getByTestId("piece-a8")).toBeTruthy();
    });
  });

  describe("drag and drop", () => {
    it("should move a piece when dragged to an empty target square", async () => {
      const screen = await renderChessBoard();
      const { dx, dy } = dragDeltaBetween("e2", "e4");

      await simulatePanResponderDrag(screen.getByTestId("piece-e2"), dx, dy);

      expect(screen.queryByTestId("piece-e2")).toBeNull();
      expect(screen.getByTestId("piece-e4")).toBeTruthy();
    });

    it("should not move an opponent's piece even if dragged", async () => {
      const screen = await renderChessBoard(); // white to move
      const { dx, dy } = dragDeltaBetween("e7", "e5");

      await simulatePanResponderDrag(screen.getByTestId("piece-e7"), dx, dy);

      expect(screen.getByTestId("piece-e7")).toBeTruthy();
      expect(screen.queryByTestId("piece-e5")).toBeNull();
    });

    it("should select the square (not move) when a piece is tapped through the drag responder without real movement", async () => {
      const screen = await renderChessBoard();

      await simulatePanResponderTap(screen.getByTestId("piece-e2"));
      await fireEvent.press(screen.getByTestId("square-e4"));

      expect(screen.getByTestId("piece-e4")).toBeTruthy();
    });

    it("should snap a piece back to its square when dragged off the board entirely", async () => {
      const screen = await renderChessBoard();

      // Drag the g1 knight far below the board - well past any legal
      // target, let alone the board's own edge. onPanResponderMove follows
      // the finger live (outside React state), so a rejected drop must be
      // explicitly snapped back or the sprite is left stranded wherever the
      // gesture ended, even though the piece is still legitimately on g1.

      await simulatePanResponderDrag(screen.getByTestId("piece-g1"), 0, 300);

      const piece = screen.getByTestId("piece-g1");
      const [{ translateX }, { translateY }] = piece.props.style.transform;
      const homePosition = getXYFromSquare("g1", PIECE_WIDTH);
      expect(translateX).toBe(homePosition.x);
      expect(translateY).toBe(homePosition.y);
    });

    it("should show the correct legal-move indicators as soon as a piece is touched", async () => {
      const screen = await renderChessBoard();

      await simulatePanResponderGrant(screen.getByTestId("piece-e2"));

      expect(screen.getByTestId("valid-move-e3").props.style.opacity).toBe(1);
      expect(screen.getByTestId("valid-move-e4").props.style.opacity).toBe(1);
      expect(screen.getByTestId("valid-move-e5").props.style.opacity).toBe(0);
    });

    it("should show the drag guide at the touched piece's own square, not a stale position, on touch-down", async () => {
      const screen = await renderChessBoard();

      await simulatePanResponderGrant(screen.getByTestId("piece-e2"));

      const guide = screen.getByTestId("drag-guide");
      expect(guide.props.style.opacity).toBe(1);
      const [{ translateX }, { translateY }] = guide.props.style.transform;
      const e2Position = getXYFromSquare("e2", PIECE_WIDTH);
      expect(translateX).toBe(e2Position.x);
      expect(translateY).toBe(e2Position.y);
    });
  });

  describe("mixed tap and drag interactions", () => {
    it("should not leave a stale tap-selection armed after an unrelated illegal drag", async () => {
      const screen = await renderChessBoard();

      await fireEvent.press(screen.getByTestId("square-e2"));

      const { dx, dy } = dragDeltaBetween("c1", "c2");
      await simulatePanResponderDrag(screen.getByTestId("piece-c1"), dx, dy);

      // Tapping an empty square now, with nothing actually selected anymore,
      // must be a no-op - NOT silently move the e2 pawn there.
      await fireEvent.press(screen.getByTestId("square-e4"));

      expect(screen.getByTestId("piece-e2")).toBeTruthy();
      expect(screen.queryByTestId("piece-e4")).toBeNull();
    });

    it("should let a fresh tap select a new piece after an unrelated illegal drag", async () => {
      const screen = await renderChessBoard();

      await fireEvent.press(screen.getByTestId("square-e2"));

      const { dx, dy } = dragDeltaBetween("c1", "c2");
      await simulatePanResponderDrag(screen.getByTestId("piece-c1"), dx, dy);

      // A fresh, deliberate tap-to-move sequence afterward should work normally.
      await fireEvent.press(screen.getByTestId("square-d2"));
      await fireEvent.press(screen.getByTestId("square-d4"));

      expect(screen.getByTestId("piece-d4")).toBeTruthy();
    });
  });

  describe("castling", () => {
    it("should castle kingside for white, moving the rook too", async () => {
      const screen = await renderChessBoard(
        "r1bqk2r/pppp1ppp/2n2n2/2b1p1N1/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 6 5",
      );

      await fireEvent.press(screen.getByTestId("square-e1"));
      await fireEvent.press(screen.getByTestId("square-g1"));

      expect(screen.getByTestId("piece-g1")).toBeTruthy();
      expect(screen.getByTestId("piece-f1")).toBeTruthy();
      expect(screen.queryByTestId("piece-h1")).toBeNull();
    });

    it("should castle queenside for black, moving the rook too", async () => {
      const screen = await renderChessBoard(
        "r3kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1",
      );

      await fireEvent.press(screen.getByTestId("square-e8"));
      await fireEvent.press(screen.getByTestId("square-c8"));

      expect(screen.getByTestId("piece-c8")).toBeTruthy();
      expect(screen.getByTestId("piece-d8")).toBeTruthy();
      expect(screen.queryByTestId("piece-a8")).toBeNull();
    });
  });

  describe("en passant", () => {
    it("should capture en passant and remove the captured pawn", async () => {
      const screen = await renderChessBoard();

      await fireEvent.press(screen.getByTestId("square-e2"));
      await fireEvent.press(screen.getByTestId("square-e4"));
      await fireEvent.press(screen.getByTestId("square-a7"));
      await fireEvent.press(screen.getByTestId("square-a6"));
      await fireEvent.press(screen.getByTestId("square-e4"));
      await fireEvent.press(screen.getByTestId("square-e5"));
      await fireEvent.press(screen.getByTestId("square-d7"));
      await fireEvent.press(screen.getByTestId("square-d5"));

      await fireEvent.press(screen.getByTestId("square-e5"));
      await fireEvent.press(screen.getByTestId("square-d6"));

      expect(screen.getByTestId("piece-d6")).toBeTruthy();
      expect(screen.queryByTestId("piece-d5")).toBeNull();
    });
  });

  describe("promotion", () => {
    it("should show the promotion menu without moving the pawn yet, then complete the move on a choice", async () => {
      const screen = await renderChessBoard("8/4P3/8/2k5/8/4K3/8/8 w - - 0 1");

      await fireEvent.press(screen.getByTestId("square-e7"));
      await fireEvent.press(screen.getByTestId("square-e8"));

      expect(screen.getByTestId("piece-e7")).toBeTruthy();
      expect(screen.queryByTestId("piece-e8")).toBeNull();
      const promotionChoice = screen.getByTestId("promote-q");

      await fireEvent.press(promotionChoice);

      expect(screen.queryByTestId("piece-e7")).toBeNull();
      expect(screen.getByTestId("piece-e8")).toBeTruthy();
      expect(screen.queryByTestId("promote-q")).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should not allow moves once the game is already over", async () => {
      const screen = await renderChessBoard();

      await fireEvent.press(screen.getByTestId("square-f2"));
      await fireEvent.press(screen.getByTestId("square-f3"));
      await fireEvent.press(screen.getByTestId("square-e7"));
      await fireEvent.press(screen.getByTestId("square-e5"));
      await fireEvent.press(screen.getByTestId("square-g2"));
      await fireEvent.press(screen.getByTestId("square-g4"));
      await fireEvent.press(screen.getByTestId("square-d8"));
      await fireEvent.press(screen.getByTestId("square-h4")); // checkmate

      await fireEvent.press(screen.getByTestId("square-e8"));
      await fireEvent.press(screen.getByTestId("square-e7"));

      expect(screen.getByTestId("piece-e8")).toBeTruthy();
      expect(screen.queryByTestId("piece-e7")).toBeNull();
    });

    it("should not crash through a chain of select/re-tap(no-op)/reselect taps", async () => {
      const screen = await renderChessBoard();

      await fireEvent.press(screen.getByTestId("square-e2")); // select pawn
      await fireEvent.press(screen.getByTestId("square-e2")); // re-tap, no-op
      await fireEvent.press(screen.getByTestId("square-d2")); // select another pawn
      await fireEvent.press(screen.getByTestId("square-b1")); // switch to knight
      await fireEvent.press(screen.getByTestId("square-b1")); // re-tap, no-op
      await fireEvent.press(screen.getByTestId("square-g1")); // select other knight
      await fireEvent.press(screen.getByTestId("square-f3")); // legal move

      expect(screen.getByTestId("piece-f3")).toBeTruthy();
      expect(screen.getByTestId("piece-e2")).toBeTruthy();
      expect(screen.getByTestId("piece-d2")).toBeTruthy();
      expect(screen.getByTestId("piece-b1")).toBeTruthy();
    });
  });
});
