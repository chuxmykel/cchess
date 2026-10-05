import { render } from "@testing-library/react-native";
import { Animated } from "react-native";
import { Square } from "chess.js";

import ValidMoveIndicators from ".";
import { SQUARES } from "../../../constants";
import { getAnimatedValue } from "../../../testUtils/animatedValue";

describe("ValidMoveIndicators", () => {
  const pieceWidth = 50;

  function buildOpacities(): Record<Square, Animated.Value> {
    return SQUARES.reduce((acc, square) => {
      acc[square] = new Animated.Value(0);
      return acc;
    }, {} as Record<Square, Animated.Value>);
  }

  it("should exist", () => {
    expect(ValidMoveIndicators).toBeDefined();
  });

  it("renders one indicator per square on the board", async () => {
    const opacities = buildOpacities();
    const screen = await render(
      <ValidMoveIndicators pieceWidth={pieceWidth} opacities={opacities} />,
    );

    expect(screen.getAllByTestId(/^valid-move-/)).toHaveLength(SQUARES.length);
  });

  it("wires each indicator's opacity to its own square's Animated.Value", async () => {
    const opacities = buildOpacities();
    opacities.e4.setValue(1);
    const screen = await render(
      <ValidMoveIndicators pieceWidth={pieceWidth} opacities={opacities} />,
    );

    expect(screen.getByTestId("valid-move-e4").props.style.opacity).toBe(
      getAnimatedValue(opacities.e4),
    );
    expect(screen.getByTestId("valid-move-e4").props.style.opacity).toBe(
      1,
    );
    expect(screen.getByTestId("valid-move-a1").props.style.opacity).toBe(
      getAnimatedValue(opacities.a1),
    );
    expect(screen.getByTestId("valid-move-a1").props.style.opacity).toBe(
      0,
    );
    expect(screen.getByTestId("valid-move-e4").props.style.opacity).not.toBe(
      screen.getByTestId("valid-move-a1").props.style.opacity,
    );
  });
});
