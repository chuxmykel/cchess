import { hasBetterMove, lineWorthShowing } from '../reviewActions';
import type { ReviewedMove } from '../types';

const move = (overrides: Partial<ReviewedMove>) =>
  ({
    uci: 'g1f3',
    bestLine: ['g1f3', 'b8c6'],
    replyLine: ['b8c6', 'f1c4'],
    moveClass: 'best',
    facts: [],
    ...overrides,
  }) as ReviewedMove;

describe('hasBetterMove', () => {
  it('is there only where another move was best', () => {
    expect(hasBetterMove(move({}))).toBe(false);
    expect(hasBetterMove(move({ uci: 'b1c3', moveClass: 'excellent' }))).toBe(
      true,
    );
    expect(hasBetterMove(move({ uci: 'b1c3', bestLine: [] }))).toBe(false);
  });

  it('is never there for a book move', () => {
    expect(hasBetterMove(move({ uci: 'b1c3', moveClass: 'book' }))).toBe(false);
  });
});

describe('lineWorthShowing', () => {
  it('shows the line after a slip or a standout move', () => {
    expect(lineWorthShowing(move({ moveClass: 'mistake' }))).toBe(true);
    expect(lineWorthShowing(move({ moveClass: 'great' }))).toBe(true);
  });

  it('shows the line after a tactic, however good the move', () => {
    expect(
      lineWorthShowing(
        move({
          moveClass: 'excellent',
          facts: [{ kind: 'takesFree', piece: 'rook' }],
        }),
      ),
    ).toBe(true);
    expect(
      lineWorthShowing(move({ facts: [{ kind: 'trapped', piece: 'bishop' }] })),
    ).toBe(true);
  });

  it('has nothing to show after a quiet move', () => {
    expect(lineWorthShowing(move({}))).toBe(false);
    expect(
      lineWorthShowing(
        move({
          moveClass: 'excellent',
          facts: [{ kind: 'saves', piece: 'queen' }],
        }),
      ),
    ).toBe(false);
  });

  it('has nothing to show once the game is over', () => {
    expect(
      lineWorthShowing(move({ moveClass: 'blunder', replyLine: [] })),
    ).toBe(false);
  });
});
