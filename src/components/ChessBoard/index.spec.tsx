import { render, screen } from '@testing-library/react-native';
import { Chess } from 'chess.js';
import Chessboard from '.';

describe("Chessboard", () => {
  function renderChessBoard() {
    const mockOnMove = jest.fn();
    const width = 400;
    const screen = render(
      <Chessboard
        game={new Chess()}
        colors={{
          dark: "black",
          light: "white"
        }}
        width={width}
        onMove={mockOnMove}
        pieces={[]}
      />
    );
    const result = screen.getByTestId("chessboard");
    return result;
  }
  it("should exist", () => {
    expect(Chessboard).toBeDefined();
  });

  it("should be a perfect square", () => {
    const result = renderChessBoard();
    expect(result.props.style.width)
      .toEqual(result.props.style.height);
  });
});

