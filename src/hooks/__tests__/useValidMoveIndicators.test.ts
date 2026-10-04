import { Square } from "chess.js";
import { renderHook } from "@testing-library/react-native";

import { useValidMoveIndicators } from "../useValidMoveIndicators";
import { getAnimatedValue } from "../../testUtils/animatedValue";
import { SQUARES } from "../../constants";

describe("useValidMoveIndicators", () => {
  function opacitySnapshot(
    opacities: ReturnType<typeof useValidMoveIndicators>["opacities"],
  ): Record<Square, number> {
    return SQUARES.reduce((acc, square) => {
      acc[square] = getAnimatedValue(opacities[square]);
      return acc;
    }, {} as Record<Square, number>);
  }

  it("starts with every square's indicator hidden", async () => {
    const getLegalMoveSquares = jest.fn(() => []);
    const { result } = await renderHook(
      (props: { legalMoveSquares: Square[] }) =>
        useValidMoveIndicators(props.legalMoveSquares, getLegalMoveSquares),
      { initialProps: { legalMoveSquares: [] } },
    );

    expect(Object.values(opacitySnapshot(result.current.opacities))).toEqual(
      SQUARES.map(() => 0),
    );
  });

  it("shows only the indicators for legalMoveSquares once they're reported from context", async () => {
    const mockLegalMoveSquares: Square[] = ["e3", "e4"];
    const nonLegalMoveSquares: Square[] = SQUARES.filter(sq => !mockLegalMoveSquares.includes(sq));
    const getLegalMoveSquares = jest.fn(() => []);
    const { result, rerender } = await renderHook(
      (props: { legalMoveSquares: Square[] }) =>
        useValidMoveIndicators(props.legalMoveSquares, getLegalMoveSquares),
      { initialProps: { legalMoveSquares: [] } },
    );

    await rerender({ legalMoveSquares: mockLegalMoveSquares });

    const snapshot = opacitySnapshot(result.current.opacities);
    expect(snapshot.e3).toBe(1);
    expect(snapshot.e4).toBe(1);
    nonLegalMoveSquares.forEach(nlms => {
      expect(snapshot[nlms]).toBe(0)
    })
  });

  it("clears every indicator once legalMoveSquares goes back to empty", async () => {
    const getLegalMoveSquares = jest.fn(() => []);
    const { result, rerender } = await renderHook(
      (props: { legalMoveSquares: Square[] }) =>
        useValidMoveIndicators(props.legalMoveSquares, getLegalMoveSquares),
      { initialProps: { legalMoveSquares: ["e3", "e4"] } },
    );

    await rerender({ legalMoveSquares: [] });

    expect(Object.values(opacitySnapshot(result.current.opacities))).toEqual(
      SQUARES.map(() => 0),
    );
  });

  it("showFor synchronously shows the indicators for a square's legal moves, ahead of any re-render", async () => {
    const getLegalMoveSquares = jest.fn((square: Square): Square[] =>
      square === "e2" ? ["e3", "e4"] : [],
    );
    const { result } = await renderHook(
      (props: { legalMoveSquares: Square[] }) =>
        useValidMoveIndicators(props.legalMoveSquares, getLegalMoveSquares),
      { initialProps: { legalMoveSquares: [] } },
    );

    result.current.showFor("e2");

    expect(getLegalMoveSquares).toHaveBeenCalledWith("e2");
    const snapshot = opacitySnapshot(result.current.opacities);
    expect(snapshot.e3).toBe(1);
    expect(snapshot.e4).toBe(1);
    expect(snapshot.e2).toBe(0);
  });

  it("lets the next legalMoveSquares update from context override whatever showFor set synchronously", async () => {
    const getLegalMoveSquares = jest.fn((square: Square): Square[] =>
      square === "e2" ? ["e3", "e4"] : [],
    );
    const { result, rerender } = await renderHook(
      (props: { legalMoveSquares: Square[] }) =>
        useValidMoveIndicators(props.legalMoveSquares, getLegalMoveSquares),
      { initialProps: { legalMoveSquares: [] } },
    );

    result.current.showFor("e2");
    await rerender({ legalMoveSquares: ["d4"] });

    const snapshot = opacitySnapshot(result.current.opacities);
    expect(snapshot.d4).toBe(1);
    expect(snapshot.e3).toBe(0);
    expect(snapshot.e4).toBe(0);
  });

  it("keeps showFor referentially stable across a re-render with the same getLegalMoveSquares", async () => {
    const getLegalMoveSquares = jest.fn(() => []);
    const { result, rerender } = await renderHook(
      (props: { legalMoveSquares: Square[] }) =>
        useValidMoveIndicators(props.legalMoveSquares, getLegalMoveSquares),
      { initialProps: { legalMoveSquares: [] } },
    );

    const { showFor } = result.current;
    await rerender({ legalMoveSquares: [] });

    expect(result.current.showFor).toBe(showFor);
  });
});
