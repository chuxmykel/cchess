import { Color } from 'chess.js';

/** The other side. A worklet too, so a drag can use it on the UI thread. */
export function otherColor(color: Color): Color {
  'worklet';
  return color === 'w' ? 'b' : 'w';
}

/** The player on one side of a game. */
export function playerOf<Player>(
  game: { white: Player; black: Player },
  color: Color,
): Player {
  return color === 'w' ? game.white : game.black;
}

/** What one side's rating gained or lost in a game, once it's rated. */
export function ratingDiffOf(
  game: { whiteRatingDiff: number | null; blackRatingDiff: number | null },
  color: Color,
): number | null {
  return color === 'w' ? game.whiteRatingDiff : game.blackRatingDiff;
}

/** The side this player played in a game, or null if they didn't. */
export function colorPlayedBy(
  game: { white: { id: string }; black: { id: string } },
  userId: string,
): Color | null {
  if (game.white.id === userId) return 'w';
  if (game.black.id === userId) return 'b';
  return null;
}
