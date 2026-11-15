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
};

const classOf = (input: Partial<ClassifyInput>) =>
  classifyMove({ ...base, ...input });

describe('classifyMove', () => {
  it('calls a move still in the book a book move', () => {
    expect(classOf({ isBook: true, isBest: true })).toBe('book');
  });

  it('calls the engine’s choice best', () => {
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

  it('calls the only good move great', () => {
    expect(classOf({ isBest: true, winSecond: 30 })).toBe('great');
  });

  it('doesn’t call an obvious recapture great', () => {
    expect(classOf({ isBest: true, winSecond: 30, isRecapture: true })).toBe(
      'best',
    );
  });

  it('calls the best move that gives up a piece brilliant', () => {
    expect(classOf({ isBest: true, isSacrifice: true, winAfter: 60 })).toBe(
      'brilliant',
    );
  });

  it('doesn’t call a sacrifice brilliant when the game was already won', () => {
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

  it('calls letting the opponent’s slip go a miss', () => {
    expect(classOf({ opponentLoss: 25, winBefore: 80, winAfter: 55 })).toBe(
      'miss',
    );
  });

  it('calls it a blunder still when the position is lost after', () => {
    expect(classOf({ opponentLoss: 25, winBefore: 80, winAfter: 20 })).toBe(
      'blunder',
    );
  });
});
