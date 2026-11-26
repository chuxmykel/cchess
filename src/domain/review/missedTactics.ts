import { Color } from 'chess.js';

import { type PuzzleTheme, themeOfFact } from '../puzzles/themes';
import { bestMoveOf } from './buildReview';
import type { GameReview, ReviewedMove } from './types';

// A tactic a side missed - a win of material or a mate it had and didn't
// play - as a puzzle of its own: the position before the move, the side to
// move, and the line that won, up to three of its moves.
export type MissedTactic = {
  ply: number;
  fen: string;
  solution: string[];
  themes: PuzzleTheme[];
};

// The longest line kept: three of the solver's moves, and the two replies.
export const MISSED_TACTIC_PLIES = 5;

function isMissedTactic(move: ReviewedMove): boolean {
  return (
    move.moveClass === 'miss' ||
    move.facts.some(
      (fact) => fact.kind === 'missesWin' || fact.kind === 'missesMate',
    )
  );
}

export function missedTactics(review: GameReview, side: Color): MissedTactic[] {
  return review.moves
    .filter((move) => move.color === side && isMissedTactic(move))
    .flatMap((move) => {
      // Ending on the solver's move: an odd number of plies.
      const line = move.bestLine.slice(0, MISSED_TACTIC_PLIES);
      const solution = line.length % 2 === 0 ? line.slice(0, -1) : line;
      if (solution.length === 0) return [];
      // What kind of tactic: what the best move would have done, then what
      // missing it was.
      const facts = [...(bestMoveOf(move)?.facts ?? []), ...move.facts];
      const themes = [
        ...new Set(
          facts
            .map((fact) => themeOfFact(fact.kind))
            .filter((theme): theme is PuzzleTheme => theme !== null),
        ),
      ].slice(0, 5);
      // Nothing more particular to say: it won material - or mated.
      if (themes.length === 0) {
        themes.push(
          move.facts.some((fact) => fact.kind === 'missesMate')
            ? 'mate'
            : 'advantage',
        );
      }
      return [{ ply: move.ply, fen: move.fenBefore, solution, themes }];
    });
}
