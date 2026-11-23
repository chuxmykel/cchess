import { classifyMove, ClassifyInput } from '../classifyMove';

const base: ClassifyInput = {
  isBest: false,
  isBook: false,
  winBefore: 55,
  winAfter: 55,
  winSecond: 54,
  rating: 2000,
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

  describe('brilliant', () => {
    // A sacrifice, the engine's choice, level after it - where the next best
    // loses.
    const sacrifice = {
      isBest: true,
      isSacrifice: true,
      winBefore: 55,
      winAfter: 55,
      winSecond: 25,
    };

    it('is the only good move that gives up a piece', () => {
      expect(classOf(sacrifice)).toBe('brilliant');
    });

    it('is the only move that wins, too', () => {
      expect(
        classOf({ ...sacrifice, winBefore: 85, winAfter: 85, winSecond: 55 }),
      ).toBe('brilliant');
    });

    it("isn't a sacrifice where the next best is nearly as good", () => {
      expect(classOf({ ...sacrifice, winSecond: 50 })).toBe('best');
    });

    it("isn't a sacrifice in a game won either way", () => {
      // 26...Rxd5+, from a game: winning by more, but winning without it.
      expect(
        classOf({ ...sacrifice, winBefore: 94, winAfter: 94, winSecond: 89 }),
      ).toBe('best');
    });

    it("isn't one leaving the mover in a bad position", () => {
      expect(
        classOf({ ...sacrifice, winBefore: 40, winAfter: 40, winSecond: 10 }),
      ).toBe('great');
    });

    it("isn't one forced - the only legal move", () => {
      expect(classOf({ ...sacrifice, winSecond: null })).toBe('best');
    });

    it('is judged as for strong players, whatever the rating', () => {
      // A gap of 12: great for a newer player, never brilliant.
      expect(
        classOf({ ...sacrifice, winAfter: 45, winSecond: 33, rating: 1000 }),
      ).toBe('great');
    });

    it("isn't a move a hair behind the engine's: the engine's was as good", () => {
      // The engine's keeps 55; this one 54.8 - judged against the engine's
      // own move, not its next best line, which may be this one.
      expect(classOf({ ...sacrifice, isBest: false, winAfter: 54.8 })).toBe(
        'best',
      );
      expect(
        classOf({
          ...sacrifice,
          isBest: false,
          isSacrifice: false,
          winAfter: 54.8,
        }),
      ).toBe('best');
    });
  });

  it("calls letting the opponent's slip go a miss", () => {
    expect(classOf({ opponentLoss: 25, winBefore: 80, winAfter: 55 })).toBe(
      'miss',
    );
  });

  it("doesn't call it a miss when the move still wins", () => {
    // Winning by less, but winning.
    expect(classOf({ opponentLoss: 25, winBefore: 95, winAfter: 78 })).toBe(
      'mistake',
    );
  });

  it("doesn't call it a miss when the slip left nothing winning", () => {
    expect(classOf({ opponentLoss: 25, winBefore: 60, winAfter: 45 })).toBe(
      'mistake',
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

  it('judges a pawn given away by the chances alone', () => {
    expect(
      classOf({ winBefore: 10, winAfter: 8, materialLoss: 1, scoreLoss: 60 }),
    ).toBe('good');
  });

  it('judges a piece given away by the chances while still completely winning', () => {
    // Up a queen: a knight less still wins.
    expect(
      classOf({ winBefore: 97, winAfter: 94, materialLoss: 3, scoreLoss: 300 }),
    ).toBe('good');
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

  describe('for a newer player', () => {
    it('calls a smaller gap the only good move', () => {
      // Level after it, losing after the next best, by 12 points.
      const move = { isBest: true, winAfter: 45, winSecond: 33 };
      expect(classOf({ ...move, rating: 2000 })).toBe('best');
      expect(classOf({ ...move, rating: 1000 })).toBe('great');
      expect(classOf({ ...move, rating: 600 })).toBe('great');
    });

    it('takes a player with no rating as rated 1500', () => {
      // Halfway: a gap of 12.5 counts, 12 doesn't.
      const move = { isBest: true, winAfter: 45 };
      expect(classOf({ ...move, rating: null, winSecond: 32.5 })).toBe('great');
      expect(classOf({ ...move, rating: null, winSecond: 33 })).toBe('best');
    });
  });
});
