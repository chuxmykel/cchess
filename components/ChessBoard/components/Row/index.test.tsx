import { render, screen } from '@testing-library/react-native';

import Row from ".";

describe("Row", () => {
  function renderChessBoardRow() {
    const screen = render(
      <Row
        colors={{
          light: "white",
          dark: "black"
        }}
        rank={1}
      />
    );
    const result = screen.getByTestId("chessboard-row");
    return result;
  }
  it("should exist", () => {
    expect(Row).toBeDefined();
  });

  it("should have 8 columns", () => {
    const result = renderChessBoardRow();
    expect(result.children).toHaveLength(8);
  });
});

