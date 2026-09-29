import { fireEvent, render } from '@testing-library/react-native';

import Row from ".";

describe("Row", () => {
  const colors = { light: "white", dark: "black" };

  async function renderChessBoardRow(onSquarePress?: (square: string) => void) {
    const screen = await render(
      <Row
        colors={colors}
        rank={1}
        onSquarePress={onSquarePress}
      />
    );
    const result = screen.getByTestId("chessboard-row");
    return { result, screen };
  }
  it("should exist", () => {
    expect(Row).toBeDefined();
  });

  it("should have 8 columns", async () => {
    const { result } = await renderChessBoardRow();
    expect(result.children).toHaveLength(8);
  });

  it("should call onSquarePress with the pressed square's notation", async () => {
    const onSquarePress = jest.fn();
    const { screen } = await renderChessBoardRow(onSquarePress);

    await fireEvent.press(screen.getByTestId("square-a1"));
    await fireEvent.press(screen.getByTestId("square-h1"));

    expect(onSquarePress).toHaveBeenNthCalledWith(1, "a1");
    expect(onSquarePress).toHaveBeenNthCalledWith(2, "h1");
  });
});

