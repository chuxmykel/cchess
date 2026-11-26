import { markCounts, markOf, wordOf } from '../marks';
import { cchessHeadline, formatSpent, guessTally, timeLines } from '../phrases';
import {
  chapterAt,
  chapters,
  decisiveMoment,
  storyStops,
  turningPoints,
} from '../story';
import { moveTimes, timeReport } from '../time';
import { MOVE_CLASSES, type ReviewedMove } from '../types';
import {
  ENDGAME,
  MIDGAME,
  makeReview,
  makeReviewedMove,
} from '../../../testUtils/reviewedMove';

const NAMES = { w: 'Ann', b: 'Bo' };
const move = makeReviewedMove;
const reviewOf = (moves: ReviewedMove[]) => makeReview(moves);

// 20 moves: the book's last at 3; white blunders at 8 (level to lost),
// black slips back at 15.
function storyGame(): ReviewedMove[] {
  return Array.from({ length: 20 }, (_, i) => {
    if (i <= 3) return move(i, { moveClass: 'book' });
    if (i === 8)
      return move(i, { moveClass: 'blunder', winLoss: 40, after: -600 });
    if (i > 8 && i < 15) return move(i, { before: -600 });
    if (i === 15)
      return move(i, {
        moveClass: 'mistake',
        winLoss: 15,
        before: -600,
        after: 0,
      });
    if (i > 15) return move(i, { before: 0 });
    return move(i);
  });
}

describe('marks', () => {
  it("marks only what matters, with chess's own symbols", () => {
    const marked = Object.fromEntries(
      MOVE_CLASSES.map((c) => [c, markOf(c)?.glyph ?? null]),
    );
    expect(marked).toEqual({
      brilliant: '!!',
      great: '!',
      best: null,
      excellent: null,
      good: null,
      book: null,
      forced: null,
      inaccuracy: '?!',
      mistake: '?',
      miss: '?',
      blunder: '??',
    });
  });

  it('says every class in plain words', () => {
    expect(wordOf('great')).toBe('Strong move');
    expect(wordOf('excellent')).toBe(wordOf('good'));
    expect(wordOf('forced')).toBe('Only move');
    expect(wordOf('miss')).toBe('Missed chance');
    expect(cchessHeadline('Nxe5', 'blunder')).toBe('Nxe5?? · Blunder');
    expect(cchessHeadline('Nf3', 'best')).toBe('Nf3 · Best move');
  });

  it("counts a side's marked moves, a miss as a mistake", () => {
    const moves = [
      move(0, { moveClass: 'miss' }),
      move(1, { moveClass: 'blunder' }),
      move(2, { moveClass: 'mistake' }),
      move(4, { moveClass: 'best' }),
    ];
    expect(markCounts(moves, 'w')).toEqual({
      '!!': 0,
      '!': 0,
      '?!': 0,
      '?': 2,
      '??': 0,
    });
  });
});

describe('story', () => {
  it('picks the largest turning points, kept apart, in the game order', () => {
    const moves = Array.from({ length: 12 }, (_, i) => move(i));
    moves[2] = move(2, { winLoss: 12 });
    moves[3] = move(3, { winLoss: 30 });
    moves[7] = move(7, { winLoss: 20 });
    moves[10] = move(10, { winLoss: 11 });
    moves[11] = move(11, { winLoss: 9 });

    // 2 is too close to 3; 11 too small; at most three.
    expect(turningPoints(moves)).toEqual([3, 7, 10]);
  });

  it('finds the move that decided the game', () => {
    const { moment, text } = decisiveMoment(reviewOf(storyGame()), NAMES);

    expect(moment).toMatchObject({
      index: 8,
      before: 'level',
      after: 'losing',
    });
    expect(text).toBe('M9?? took Ann from level to losing.');
  });

  it('names the closest call when no move decided it', () => {
    const moves = [move(0), move(1, { moveClass: 'inaccuracy', winLoss: 6 })];

    const { moment, text } = decisiveMoment(reviewOf(moves), NAMES);

    expect(moment).toBeNull();
    expect(text).toBe('No single move decided it - the closest was M2?!.');
  });

  it('tells the game in chapters: the opening, each turning point, the finish', () => {
    const story = chapters(reviewOf(storyGame()), NAMES, 'black');

    expect(
      story.map(({ kind, start, end, turn }) => [kind, start, end, turn]),
    ).toEqual([
      ['opening', 0, 3, null],
      ['turn', 4, 8, 8],
      ['turn', 9, 15, 15],
      ['finish', 16, 19, null],
    ]);
    expect(story[0].text).toBe(
      'Four Knights Game. Out of the opening, the game is level.',
    );
    expect(story[1]).toMatchObject({
      title: 'Move 5',
      text: 'Ann played M9??: the game was level; now Bo is winning.',
    });
    expect(story[3].text).toBe('Bo won.');
    expect(chapterAt(story, 12)).toBe(2);
  });

  it('tells a game with one turning point in three chapters', () => {
    const moves = storyGame();
    // Black's slip back at 15 smaller than a turning point's.
    moves[15] = move(15, { moveClass: 'inaccuracy', winLoss: 6, before: -600 });

    const story = chapters(reviewOf(moves), NAMES, 'black');

    expect(story.map(({ kind, start, end }) => [kind, start, end])).toEqual([
      ['opening', 0, 3],
      ['turn', 4, 8],
      ['finish', 9, 19],
    ]);
  });

  it('tells a game with no turning point by its phases', () => {
    const moves = Array.from({ length: 10 }, (_, i) =>
      move(i, {
        moveClass: i < 2 ? 'book' : 'good',
        fen: i >= 6 ? ENDGAME : MIDGAME,
      }),
    );

    const story = chapters(reviewOf(moves), NAMES, 'draw');

    expect(story.map(({ kind, start, end }) => [kind, start, end])).toEqual([
      ['opening', 0, 1],
      ['middlegame', 2, 5],
      ['endgame', 6, 9],
    ]);
    expect(story[2].text).toBe('The game is level at the finish. A draw.');
  });

  it("stops at each chapter's turn or end, and asks at the side's own turns and standouts", () => {
    const moves = storyGame();
    moves[12] = move(12, { moveClass: 'great', before: -600 });
    const story = chapters(reviewOf(moves), NAMES, 'black');

    expect(storyStops(story, moves, 'w')).toEqual({
      stops: [3, 8, 12, 15, 19],
      guesses: [8, 12],
    });
    expect(storyStops(story, moves, 'b')).toEqual({
      stops: [3, 8, 15, 19],
      guesses: [15],
    });
  });

  it('tallies the guesses', () => {
    expect(guessTally(2, 2)).toMatch(/all 2/);
    expect(guessTally(1, 3)).toMatch(/1 of 3/);
  });
});

describe('time', () => {
  it("takes each move's time from the clock, its increment added back", () => {
    const times = moveTimes(
      {
        initialMs: 180_000,
        incrementMs: 2_000,
        afterMs: [180_000, 180_000, 170_000, 175_000],
      },
      ['w', 'b', 'w', 'b'],
    );

    // First moves start no clock; then 180+2-170 and 180+2-175.
    expect(times).toEqual([0, 0, 12_000, 7_000]);
  });

  it("finds the side's longest think, a hasty slip, and how it held up short of time", () => {
    const moves = Array.from({ length: 16 }, (_, i) =>
      move(i, { accuracy: i < 10 ? 95 : 60 }),
    );
    moves[10] = move(10, { moveClass: 'blunder', accuracy: 20 });
    // White's clock: 100s, then 90 (10s), 50 (40s), then down to 20s left
    // and on - the last four moves under a quarter.
    const whiteAfter = [100, 90, 50, 45, 20, 18, 15, 14];
    const afterMs: number[] = [];
    for (let i = 0; i < 16; i++) {
      afterMs.push(i % 2 === 0 ? whiteAfter[i / 2] * 1000 : 100_000);
    }
    const report = timeReport(
      moves,
      { initialMs: 100_000, incrementMs: 0, afterMs },
      'w',
    );

    expect(report.longest).toMatchObject({ index: 4, ms: 40_000 });
    expect(report.hastySlip).toMatchObject({ index: 10, ms: 2_000 });
    // Under a quarter left from move 10: the blunder (20) and two at 60.
    expect(report.lowTime?.plenty).toBe(95);
    expect(report.lowTime?.short).toBeCloseTo(46.67, 1);
  });

  it('speaks to the side reviewed, or of it by name for a game watched', () => {
    const report = {
      longest: { move: move(4, { moveClass: 'best' }), ms: 44_000 },
      hastySlip: null,
      lowTime: null,
    };

    expect(timeLines(report)).toEqual([
      'Your longest think: 44s on M5, best move.',
    ]);
    expect(timeLines(report, 'Ann')).toEqual([
      "Ann's longest think: 44s on M5, best move.",
    ]);
  });

  it('says how long a move took', () => {
    expect(formatSpent(4_240)).toBe('4.2s');
    expect(formatSpent(12_400)).toBe('12s');
    expect(formatSpent(90_000)).toBe('1m 30s');
    expect(formatSpent(120_000)).toBe('2m');
  });
});
