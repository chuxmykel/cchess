import {
  getSquareFromXY,
  getXYFromSquare,
  isOnBoard,
} from '../boardCoordinates';

describe('boardCoordinates', () => {
  const width = 50;

  describe("from white's perspective", () => {
    it('round-trips every square through XY and back', () => {
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

      files.forEach((file) => {
        ranks.forEach((rank) => {
          const square = `${file}${rank}`;
          const position = getXYFromSquare(square, width);
          expect(getSquareFromXY(position, width)).toBe(square);
        });
      });
    });

    it('maps a1 to the bottom-left and h8 to the top-right', () => {
      expect(getXYFromSquare('a1', width)).toEqual({ x: 0, y: 7 * width });
      expect(getXYFromSquare('h8', width)).toEqual({ x: 7 * width, y: 0 });
    });

    it('maps off-board positions to invalid squares', () => {
      expect(getSquareFromXY({ x: 8 * width, y: 0 }, width)).toBe('i8');
      expect(getSquareFromXY({ x: 0, y: 8 * width }, width)).toBe('a0');
    });
  });

  describe("from black's perspective", () => {
    it('round-trips every square through XY and back', () => {
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

      files.forEach((file) => {
        ranks.forEach((rank) => {
          const square = `${file}${rank}`;
          const position = getXYFromSquare(square, width, 'b');
          expect(getSquareFromXY(position, width, 'b')).toBe(square);
        });
      });
    });

    it('maps h8 to the bottom-left and a1 to the top-right', () => {
      expect(getXYFromSquare('h8', width, 'b')).toEqual({ x: 0, y: 7 * width });
      expect(getXYFromSquare('a1', width, 'b')).toEqual({ x: 7 * width, y: 0 });
    });

    it('maps off-board positions to invalid squares', () => {
      expect(getSquareFromXY({ x: -width, y: 0 }, width, 'b')).toBe('i1');
      expect(getSquareFromXY({ x: 0, y: -width }, width, 'b')).toBe('h0');
    });
  });

  describe('isOnBoard', () => {
    it('is true anywhere on the board, edges included', () => {
      expect(isOnBoard({ x: 0, y: 0 }, width)).toBe(true);
      expect(isOnBoard({ x: 8 * width - 1, y: 8 * width - 1 }, width)).toBe(
        true,
      );
    });

    it('is false past any edge', () => {
      expect(isOnBoard({ x: -1, y: 0 }, width)).toBe(false);
      expect(isOnBoard({ x: 0, y: -1 }, width)).toBe(false);
      expect(isOnBoard({ x: 8 * width, y: 0 }, width)).toBe(false);
      expect(isOnBoard({ x: 0, y: 8 * width }, width)).toBe(false);
    });
  });
});
