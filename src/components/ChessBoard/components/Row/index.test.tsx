import { render, screen } from '@testing-library/react-native';

import Row from ".";

describe("Row", () => {
  async function renderChessBoardRow() {
    const screen = await render(
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

  it("should have 8 columns", async () => {
    const result = await renderChessBoardRow();
    expect(result.children).toHaveLength(8);
  });
});

