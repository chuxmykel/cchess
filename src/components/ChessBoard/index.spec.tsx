import { render, screen } from '@testing-library/react-native';
import Chessboard from '.';

describe("Chessboard", () => {

  function renderChessBoard() {
    const screen = render(<Chessboard />);
    const result = screen.getByTestId("chessboard");
    return result;
  }
  it("should exist", () => {
    expect(Chessboard).toBeDefined();
  });

  it("should have 8 rows", () => {
    const result = renderChessBoard();
    expect(result.children).toHaveLength(8);
  });

  it("should be a perfect square", () => {
    const result = renderChessBoard();
    expect(result.props.style.width)
      .toEqual(result.props.style.height);
  });

});

