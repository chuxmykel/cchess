import { Color } from 'chess.js';

import { ReviewAs } from '../../constants/review';
import { colorPlayedBy } from '../../domain/players';
import type { ReviewedGame } from '../../hooks/useGameReview';

// The side a review stops at: as set - yours, in a game you played, else
// white's.
export function reviewedSide(
  reviewAs: ReviewAs,
  game: ReviewedGame,
  userId: string | null,
): Color {
  if (reviewAs === 'white') return 'w';
  if (reviewAs === 'black') return 'b';
  return (userId && colorPlayedBy(game, userId)) || 'w';
}
