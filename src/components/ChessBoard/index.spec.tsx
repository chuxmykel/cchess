import { render, screen } from '@testing-library/react-native';
import Chessboard from '.';

describe("Chessboard", () => {

  function renderChessBoard() {
    const board = [
      ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
      ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
      [" ", " ", " ", " ", " ", " ", " ", " "],
      [" ", " ", " ", " ", " ", " ", " ", " "],
      [" ", " ", " ", " ", " ", " ", " ", " "],
      [" ", " ", " ", " ", " ", " ", " ", " "],
      ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp",],
      ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"],
    ];
    const width = 400;
    const screen = render(
      <Chessboard
        board={board}
        colors={{
          dark: "black",
          light: "white"
        }}
        width={width}
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

