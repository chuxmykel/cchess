import { renderHook } from "@testing-library/react-native";

import { usePieceAnimations } from "../usePieceAnimations";
import { DomainPiece } from "../../domain/types";

describe("usePieceAnimations", () => {
  const pieceWidth = 50;
  const twoPieces: DomainPiece[] = [
    { square: "e2", type: "p", color: "w" },
    { square: "e7", type: "p", color: "b" },
  ];

  it("returns the same array reference across re-renders when `pieces` itself is unchanged", async () => {
    // Regression guard for the fix to the drag-guide hide delay: useChessGame
    // only ever produces a new `pieces` array on an actually-applied move, so
    // a re-render triggered by anything else (e.g. selecting a square) should
    // be able to reuse this hook's previous return value exactly - a fresh
    // array here, even with identical contents, would give Piece's
    // React.memo nothing to bail out on, forcing every piece to re-render.
    const { result, rerender } = await renderHook(
      (props: { pieces: DomainPiece[] }) => usePieceAnimations(props.pieces, null, pieceWidth),
      { initialProps: { pieces: twoPieces } },
    );

    const firstResult = result.current;
    await rerender({ pieces: twoPieces });

    expect(result.current).toBe(firstResult);
  });

  it("returns a new array when `pieces` is a genuinely new reference", async () => {
    const { result, rerender } = await renderHook(
      (props: { pieces: DomainPiece[] }) => usePieceAnimations(props.pieces, null, pieceWidth),
      { initialProps: { pieces: twoPieces } },
    );

    const firstResult = result.current;
    const newPieces = [...twoPieces];
    await rerender({ pieces: newPieces });

    expect(result.current).not.toBe(firstResult);
    // Same pieces, so the same underlying per-piece entries should still
    // come back (identity by square is preserved), just in a fresh array.
    expect(result.current).toEqual(firstResult);
  });

  it("keeps each individual piece's view referentially stable across an unrelated re-render", async () => {
    const { result, rerender } = await renderHook(
      (props: { pieces: DomainPiece[] }) => usePieceAnimations(props.pieces, null, pieceWidth),
      { initialProps: { pieces: twoPieces } },
    );

    const firstPieceView = result.current[0];
    await rerender({ pieces: [...twoPieces] });

    // The array wrapper may be new (previous test), but each piece's own
    // AnimatedPieceView - and crucially its Animated.Value objects - must be
    // the exact same object, or animations would silently stop working.
    expect(result.current[0]).toBe(firstPieceView);
  });
});
