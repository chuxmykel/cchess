import { Color } from 'chess.js';

import type { EngineScore } from '../evalScore';
import {
  chapterText,
  decisiveLine,
  type Names,
  type Standing,
} from './phrases';
import { isEndgame } from './themes';
import { STANDING, TURNING_POINT } from './thresholds';
import type { GameReview, ReviewedMove } from './types';
import { winPercent } from './winChances';

// The cchess review tells a game as a story: the move that decided it, and
// its chapters - the opening, each turning point, the finish.

export type GameResult = 'white' | 'black' | 'draw' | null;

// Where a side stands, by its winning chances.
export function standingOf(score: EngineScore, color: Color): Standing {
  const chances = winPercent(score, color);
  if (chances < STANDING.losing) return 'losing';
  if (chances >= STANDING.winning) return 'winning';
  return 'level';
}

export type DecisiveMoment = {
  // An index into the review's moves.
  index: number;
  // Where the mover stood before the move, and after.
  before: Standing;
  after: Standing;
  text: string;
};

// The turning points: moves giving away a mistake's share of the mover's
// winning chances, the largest first, kept apart, then in the game's order.
export function turningPoints(moves: ReviewedMove[]): number[] {
  const candidates = moves
    .map((move, index) => ({ index, loss: move.winLoss }))
    .filter(({ loss }) => loss >= TURNING_POINT.loss)
    .sort((a, b) => b.loss - a.loss);
  const chosen: number[] = [];
  for (const { index } of candidates) {
    if (chosen.length >= TURNING_POINT.most) break;
    if (chosen.every((c) => Math.abs(c - index) >= TURNING_POINT.apart)) {
      chosen.push(index);
    }
  }
  return chosen.sort((a, b) => a - b);
}

// The move that decided the game: the largest turning point. Null when no
// move gave that much away - the text then names the closest call, if any.
export function decisiveMoment(
  review: GameReview,
  names: Names,
): { moment: DecisiveMoment | null; text: string } {
  const { moves } = review;
  let index = -1;
  moves.forEach((move, i) => {
    if (index < 0 || move.winLoss > moves[index].winLoss) index = i;
  });
  if (index < 0) return { moment: null, text: decisiveLine(null, names) };
  const move = moves[index];
  if (move.winLoss < TURNING_POINT.loss) {
    return { moment: null, text: decisiveLine({ closest: move }, names) };
  }
  const before = standingOf(move.scoreBefore, move.color);
  const after = standingOf(move.scoreAfter, move.color);
  return {
    moment: {
      index,
      before,
      after,
      text: decisiveLine({ move, before, after }, names),
    },
    text: decisiveLine({ move, before, after }, names),
  };
}

export type ChapterKind =
  'opening' | 'turn' | 'middlegame' | 'endgame' | 'finish';

export type Chapter = {
  kind: ChapterKind;
  // Its first and last moves, as indexes into the review's moves.
  start: number;
  end: number;
  // Its turning point - its last move - for a turn.
  turn: number | null;
  title: string;
  text: string;
};

// The game in chapters: the opening, up to the book's last move (or the
// first turning point); one chapter ending on each turning point; then the
// finish. A game without one is told by its phases instead - the opening,
// the middlegame and, when it gets there, the endgame.
export function chapters(
  review: GameReview,
  names: Names,
  result: GameResult,
): Chapter[] {
  const { moves } = review;
  if (moves.length === 0) return [];
  const last = moves.length - 1;
  const turns = turningPoints(moves);
  const lastBook = moves.findLastIndex((m) => m.moveClass === 'book');
  const openingEnd = Math.min(lastBook, (turns[0] ?? last + 1) - 1, last);

  const made: Chapter[] = [];
  const add = (
    kind: ChapterKind,
    start: number,
    end: number,
    turn: number | null = null,
  ) => {
    if (end < start) return;
    made.push({
      kind,
      start,
      end,
      turn,
      ...chapterText(kind, moves, start, end, {
        names,
        result,
        opening: review.opening?.name ?? null,
      }),
    });
  };

  add('opening', 0, openingEnd);
  if (turns.length > 0) {
    let from = openingEnd + 1;
    for (const turn of turns) {
      add('turn', from, turn, turn);
      from = turn + 1;
    }
    add('finish', from, last);
    return made;
  }
  const from = openingEnd + 1;
  const endgameAt = moves.findIndex(
    (move, index) => index >= from && isEndgame(move.fenBefore),
  );
  if (endgameAt < 0) {
    add('middlegame', from, last);
  } else {
    add('middlegame', from, endgameAt - 1);
    add('endgame', endgameAt, last);
  }
  return made;
}

// Where Next stops, and where it first asks what you'd play: each
// chapter's turning point, or its end; and the side's own standout moves.
// A guess is asked at a turning point the side made, and at its standouts.
export function storyStops(
  story: Chapter[],
  moves: ReviewedMove[],
  side: Color,
): { stops: number[]; guesses: number[] } {
  const standouts = moves
    .map((move, index) => ({ move, index }))
    .filter(
      ({ move }) =>
        move.color === side &&
        (move.moveClass === 'brilliant' || move.moveClass === 'great'),
    )
    .map(({ index }) => index);
  const ownTurns = story
    .filter((c) => c.turn !== null && moves[c.turn].color === side)
    .map((c) => c.turn as number);
  const unique = (list: number[]) => [...new Set(list)].sort((a, b) => a - b);
  return {
    stops: unique([...story.map((c) => c.turn ?? c.end), ...standouts]),
    guesses: unique([...ownTurns, ...standouts]),
  };
}

// The chapter a move is in.
export function chapterAt(story: Chapter[], index: number): number {
  return story.findIndex((c) => index >= c.start && index <= c.end);
}
