import { EngineScore } from '../../evalScore';
import { gameAccuracy, moveAccuracy } from '../accuracy';
import { whiteWinningChances, winPercent } from '../winChances';

const cp = (value: number): EngineScore => ({ kind: 'cp', cp: value });

describe('winning chances', () => {
  it('is level at 0', () => {
    expect(winPercent(cp(0), 'w')).toBe(50);
    expect(winPercent(cp(0), 'b')).toBe(50);
  });

  it('follows lichess’s curve', () => {
    // A pawn up is about 59%, as lichess has it.
    expect(winPercent(cp(100), 'w')).toBeCloseTo(59.1, 1);
    expect(winPercent(cp(100), 'b')).toBeCloseTo(40.9, 1);
  });

  it('counts scores past ten pawns, and mates, as ten pawns', () => {
    const tenPawns = whiteWinningChances(cp(1000));
    expect(whiteWinningChances(cp(5000))).toBe(tenPawns);
    expect(whiteWinningChances({ kind: 'mate', moves: 3, winner: 'w' })).toBe(
      tenPawns,
    );
    expect(
      whiteWinningChances({ kind: 'mate', moves: 3, winner: 'b' }),
    ).toBeCloseTo(-tenPawns);
  });
});

describe('accuracy', () => {
  it('is 100 for a move that keeps the chances', () => {
    expect(moveAccuracy(60, 60)).toBe(100);
    expect(moveAccuracy(40, 55)).toBe(100);
  });

  it('falls with the chances given away, as lichess counts', () => {
    // 103.1668 * e^(-0.04354 * 10) - 3.1669, plus lichess's 1.
    expect(moveAccuracy(60, 50)).toBeCloseTo(64.59, 1);
    expect(moveAccuracy(90, 10)).toBeLessThan(2);
    expect(moveAccuracy(100, 0)).toBe(0);
  });

  it('is 100 each for a game played perfectly', () => {
    const scores = Array.from({ length: 21 }, () => cp(20));
    expect(gameAccuracy(scores)).toEqual({ w: 100, b: 100 });
  });

  it('marks down the side that blundered', () => {
    const scores = [cp(20), cp(25), cp(20), cp(-400), cp(-400), cp(-410)];
    const { w, b } = gameAccuracy(scores);
    expect(w!).toBeLessThan(70);
    expect(b!).toBeGreaterThan(95);
  });

  it('counts a set-up position with black to move first', () => {
    const scores = [cp(20), cp(500), cp(500)];
    const { w, b } = gameAccuracy(scores, 'b');
    expect(b!).toBeLessThan(50);
    expect(w).toBe(100);
  });

  it('has none for a game with no moves', () => {
    expect(gameAccuracy([cp(0)])).toEqual({ w: null, b: null });
  });
});
