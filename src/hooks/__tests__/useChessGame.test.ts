import { act, renderHook } from "@testing-library/react-native";

import { useChessGame } from "../useChessGame";

describe("useChessGame", () => {
  it("starts with the standard setup, white to move, and nothing selected", async () => {
    const { result } = await renderHook(() => useChessGame());

    expect(result.current.pieces).toHaveLength(32);
    expect(result.current.turn).toBe("w");
    expect(result.current.isGameOver).toBe(false);
    expect(result.current.selectedSquare).toBeNull();
    expect(result.current.legalMoveSquares).toEqual([]);
  });

  it("selects an own piece on tap and lists its legal destination squares", async () => {
    const { result } = await renderHook(() => useChessGame());

    await act(() => {
      result.current.handleSquareTap("e2");
    });

    expect(result.current.selectedSquare).toBe("e2");
    expect([...result.current.legalMoveSquares].sort()).toEqual(["e3", "e4"]);
  });

  it("treats tapping the same selected square again as a no-op", async () => {
    const { result } = await renderHook(() => useChessGame());

    await act(() => {
      result.current.handleSquareTap("e2");
    });
    await act(() => {
      result.current.handleSquareTap("e2");
    });

    expect(result.current.selectedSquare).toBe("e2");
  });

  it("switches selection when a different own piece is tapped", async () => {
    const { result } = await renderHook(() => useChessGame());

    await act(() => {
      result.current.handleSquareTap("e2");
    });
    await act(() => {
      result.current.handleSquareTap("b1");
    });

    expect(result.current.selectedSquare).toBe("b1");
  });

  it("commits the move and clears selection when a legal target square is tapped", async () => {
    const { result } = await renderHook(() => useChessGame());

    await act(() => {
      result.current.handleSquareTap("e2");
    });
    await act(() => {
      result.current.handleSquareTap("e4");
    });

    expect(result.current.selectedSquare).toBeNull();
    expect(result.current.legalMoveSquares).toEqual([]);
    expect(result.current.turn).toBe("b");
    expect(result.current.pieces).toEqual(
      expect.arrayContaining([{ square: "e4", type: "p", color: "w" }]),
    );
    expect(result.current.lastMove).toMatchObject({ from: "e2", to: "e4" });
  });

  it("rejects an illegal attemptMove (e.g. a drag) without changing the board, and clears any selection", async () => {
    const { result } = await renderHook(() => useChessGame());

    await act(() => {
      result.current.handleSquareTap("e2"); // arm a selection via tap
    });
    await act(() => {
      result.current.attemptMove("c1", "c2"); // unrelated illegal drag - bishop boxed in
    });

    expect(result.current.selectedSquare).toBeNull();
    expect(result.current.turn).toBe("w");
  });

  it("does not leave a stale tap-selection armed after an unrelated illegal drag", async () => {
    const { result } = await renderHook(() => useChessGame());

    await act(() => {
      result.current.handleSquareTap("e2");
    });
    await act(() => {
      result.current.attemptMove("c1", "c2"); // illegal
    });
    await act(() => {
      result.current.handleSquareTap("e4"); // nothing selected now - must be a no-op
    });

    expect(result.current.pieces).toEqual(
      expect.arrayContaining([{ square: "e2", type: "p", color: "w" }]),
    );
    expect(result.current.turn).toBe("w");
  });

  it("asks for a promotion choice instead of moving, then applies it once chosen", async () => {
    const { result } = await renderHook(() =>
      useChessGame("8/4P3/8/2k5/8/4K3/8/8 w - - 0 1"),
    );

    await act(() => {
      result.current.attemptMove("e7", "e8");
    });

    expect(result.current.pendingPromotion).toEqual({ from: "e7", to: "e8" });
    expect(result.current.pieces).toEqual(
      expect.arrayContaining([{ square: "e7", type: "p", color: "w" }]),
    );

    await act(() => {
      result.current.promoteTo("q");
    });

    expect(result.current.pendingPromotion).toBeNull();
    expect(result.current.pieces).toEqual(
      expect.arrayContaining([{ square: "e8", type: "q", color: "w" }]),
    );
    expect(result.current.turn).toBe("b");
  });

  it("reports game over once checkmate is delivered", async () => {
    const { result } = await renderHook(() => useChessGame());

    await act(() => {
      result.current.attemptMove("f2", "f3");
    });
    await act(() => {
      result.current.attemptMove("e7", "e5");
    });
    await act(() => {
      result.current.attemptMove("g2", "g4");
    });
    await act(() => {
      result.current.attemptMove("d8", "h4");
    });

    expect(result.current.isGameOver).toBe(true);
  });

  it("ignores taps once the game is over", async () => {
    const { result } = await renderHook(() => useChessGame());

    await act(() => {
      result.current.attemptMove("f2", "f3");
    });
    await act(() => {
      result.current.attemptMove("e7", "e5");
    });
    await act(() => {
      result.current.attemptMove("g2", "g4");
    });
    await act(() => {
      result.current.attemptMove("d8", "h4");
    });
    expect(result.current.isGameOver).toBe(true);

    await act(() => {
      result.current.handleSquareTap("e8");
    });
    await act(() => {
      result.current.handleSquareTap("e7");
    });

    expect(result.current.selectedSquare).toBeNull();
    expect(result.current.pieces).toEqual(
      expect.arrayContaining([{ square: "e8", type: "k", color: "b" }]),
    );
  });
});
