
import { render, screen } from '@testing-library/react-native';

import Square from ".";

describe("Square", () => {
  function renderChessBoardSquareWithCoordinates() {
    return render(
      <Square
        color="black"
        textColor="white"
        rank={1}
        file={"a"}
      />
    );
  }

  function renderChessBoardSquareWithoutCoordinates() {
    return render(
      <Square
        color="black"
        textColor="white"
        rank={2}
        file={"b"}
      />
    );
  }

  it("should exist", () => {
    expect(Square).toBeDefined();
  });

  it("should display coordinates if it's an a file square", () => {
    const screen = renderChessBoardSquareWithCoordinates();
    const squareWithCoordinate = screen.getByText("a");

    expect(squareWithCoordinate).toBeDefined();
  });

  it("should display coordinates if it's a rank 1 square", () => {
    const screen = renderChessBoardSquareWithCoordinates();
    const squareWithCoordinate = screen.getByText("1");

    expect(squareWithCoordinate).toBeDefined();
  });

  it("should not display coordinates if it's not a rank 1 square", () => {
    const screen = renderChessBoardSquareWithoutCoordinates();
    try {
      screen.getByText("2");
    } catch (error) {
      expect(error.message).toBe("Unable to find an element with text: 2");
    }
  });

  it("should not display coordinates if it's not an a file square", () => {
    const screen = renderChessBoardSquareWithoutCoordinates();
    try {
      screen.getByText("b");
    } catch (error) {
      expect(error.message).toBe("Unable to find an element with text: b");
    }
  });
});

