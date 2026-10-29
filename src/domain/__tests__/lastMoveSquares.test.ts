import { lastMoveSquares } from '../lastMoveSquares';

describe('lastMoveSquares', () => {
  it("marks a move's two squares", () => {
    expect(lastMoveSquares({ from: 'e2', to: 'e4', piece: 'p' })).toEqual({
      from: 'e2',
      to: 'e4',
    });
  });

  it('marks a king stepping one square as it is', () => {
    expect(lastMoveSquares({ from: 'e1', to: 'f1', piece: 'k' })).toEqual({
      from: 'e1',
      to: 'f1',
    });
  });

  it.each([
    ['white, king side', 'e1', 'g1', 'h1'],
    ['white, queen side', 'e1', 'c1', 'a1'],
    ['black, king side', 'e8', 'g8', 'h8'],
    ['black, queen side', 'e8', 'c8', 'a8'],
  ] as const)(
    "marks the king's and rook's starting squares when castling %s",
    (_, from, to, rook) => {
      expect(lastMoveSquares({ from, to, piece: 'k' })).toEqual({
        from,
        to: rook,
      });
    },
  );

  it('marks any other piece moving two files as it is', () => {
    expect(lastMoveSquares({ from: 'e1', to: 'g1', piece: 'r' })).toEqual({
      from: 'e1',
      to: 'g1',
    });
  });
});
