import { PanResponderGestureState } from "react-native";

import { generatePieceId, getNewPositionFromGesture } from "../animation";

function fakeGestureState(dx: number, dy: number): PanResponderGestureState {
  return {
    stateID: 0,
    moveX: 0,
    moveY: 0,
    x0: 0,
    y0: 0,
    dx,
    dy,
    vx: 0,
    vy: 0,
    numberActiveTouches: 1,
    _accountsForMovesUpTo: 0,
  };
}

describe("getNewPositionFromGesture", () => {
  const width = 50;

  it("snaps back to the starting square when the drag stays under half a square", () => {
    const result = getNewPositionFromGesture({ x: 0, y: 0 }, fakeGestureState(20, 10), width);

    expect(result).toEqual({ x: 0, y: 0 });
  });

  it("snaps to the next square once the drag passes half a square", () => {
    const result = getNewPositionFromGesture({ x: 0, y: 0 }, fakeGestureState(30, -30), width);

    expect(result).toEqual({ x: 50, y: -50 });
  });

  it("snaps relative to a non-origin starting position", () => {
    const result = getNewPositionFromGesture({ x: 100, y: 150 }, fakeGestureState(60, 0), width);

    expect(result).toEqual({ x: 150, y: 150 });
  });
});

describe("generatePieceId", () => {
  it("prefixes the id with the piece's color and type", () => {
    const id = generatePieceId("w", "p", "e2");

    expect(id.startsWith("wp-e2-")).toBe(true);
  });

  it("generates a different id on every call, even for the same piece/square", () => {
    const first = generatePieceId("b", "n", "g8");
    const second = generatePieceId("b", "n", "g8");

    expect(first).not.toBe(second);
  });
});
