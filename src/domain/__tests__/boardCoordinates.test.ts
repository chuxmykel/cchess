import { getSquareFromXY, getXYFromSquare } from "../boardCoordinates";

describe("boardCoordinates", () => {
  const width = 50;

  it("round-trips every square through XY and back", () => {
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const ranks = ["1", "2", "3", "4", "5", "6", "7", "8"];

    files.forEach((file) => {
      ranks.forEach((rank) => {
        const square = `${file}${rank}`;
        const position = getXYFromSquare(square, width);
        expect(getSquareFromXY(position, width)).toBe(square);
      });
    });
  });

  it("maps a1 to the bottom-left and h8 to the top-right", () => {
    expect(getXYFromSquare("a1", width)).toEqual({ x: 0, y: 7 * width });
    expect(getXYFromSquare("h8", width)).toEqual({ x: 7 * width, y: 0 });
  });
});
