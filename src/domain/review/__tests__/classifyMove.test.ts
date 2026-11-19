import { classifyMove, ClassifyInput } from '../classifyMove';

const base: ClassifyInput = {
  isBest: false,
  isBook: false,
  winBefore: 55,
  winAfter: 55,
  winSecond: 54,
  opponentLoss: 0,
  isSacrifice: false,
  isRecapture: false,
  materialLoss: 0,
  scoreLoss: 0,
};

const classOf = (input: Partial<ClassifyInput>) =>
  classifyMove({ ...base, ...input });

describe('classifyMove', () => {
  it('calls a move still in the book a book move', () => {
    expect(classOf({ isBook: true, isBest: true })).toBe('book');
  });

  it("calls the engine's choice best", () => {
    expect(classOf({ isBest: true })).toBe('best');
  });

  it('calls another move that gives nothing away best too', () => {
    expect(classOf({ winAfter: 54.8 })).toBe('best');
  });

  it.each([
    [53.5, 'excellent'],
    [51, 'good'],
    [47, 'inaccuracy'],
    [40, 'mistake'],
    [20, 'blunder'],
  ] as const)('grades a move leaving %s%% of 55%% %s', (winAfter, expected) => {
    expect(classOf({ winAfter })).toBe(expected);
  });

  it('calls the only move that holds the game great', () => {
    // Level after it; the next best loses.
    expect(classOf({ isBest: true, winSecond: 30 })).toBe('great');
  });

  it('calls the only move that wins great', () => {
    expect(
      classOf({ isBest: true, winBefore: 80, winAfter: 80, winSecond: 55 }),
    ).toBe('great');
  });

  it("doesn't call a move great when the next best stands as well", () => {
    // Winning either way, if by less.
    expect(
      classOf({ isBest: true, winBefore: 97, winAfter: 97, winSecond: 75 }),
    ).toBe('best');
    // Lost either way.
    expect(
      classOf({ isBest: true, winBefore: 30, winAfter: 30, winSecond: 5 }),
    ).toBe('best');
  });

  it("doesn't call an obvious recapture great", () => {
    expect(classOf({ isBest: true, winSecond: 30, isRecapture: true })).toBe(
      'best',
    );
  });

  it('calls the best move that gives up a piece brilliant', () => {
    expect(classOf({ isBest: true, isSacrifice: true, winAfter: 60 })).toBe(
      'brilliant',
    );
  });

  it("doesn't call a sacrifice brilliant when the game was already won", () => {
    expect(
      classOf({
        isBest: true,
        isSacrifice: true,
        winBefore: 98,
        winAfter: 98,
        winSecond: 97,
      }),
    ).toBe('best');
  });

  it("calls letting the opponent's slip go a miss", () => {
    expect(classOf({ opponentLoss: 25, winBefore: 80, winAfter: 55 })).toBe(
      'miss',
    );
  });

  it('calls it a blunder still when the position is lost after', () => {
    expect(classOf({ opponentLoss: 25, winBefore: 80, winAfter: 20 })).toBe(
      'blunder',
    );
  });

  it('calls a piece given away a mistake, though the game was already lost', () => {
    // Down six pawns already: dropping a bishop barely moves the chances.
    expect(
      classOf({ winBefore: 10, winAfter: 6.5, materialLoss: 3, scoreLoss: 92 }),
    ).toBe('mistake');
  });

  it('calls a pawn given away at least an inaccuracy', () => {
    expect(
      classOf({ winBefore: 10, winAfter: 8, materialLoss: 1, scoreLoss: 60 }),
    ).toBe('inaccuracy');
  });

  it('leaves a worse class as it is, and the best move alone', () => {
    expect(classOf({ winAfter: 20, materialLoss: 3, scoreLoss: 400 })).toBe(
      'blunder',
    );
    expect(classOf({ isBest: true, materialLoss: 3, scoreLoss: 100 })).toBe(
      'best',
    );
  });

  it('ignores material when the score hardly moves', () => {
    expect(
      classOf({ winBefore: 10, winAfter: 9, materialLoss: 3, scoreLoss: 30 }),
    ).toBe('excellent');
  });
});
