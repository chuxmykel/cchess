import { GameType } from '../domain/types';
import { GAME_TYPE_LABELS } from './timeControls';

/** What a rating is kept for: each game type, and puzzles. */
export type RatingCategory = GameType | 'puzzles';

export const RATING_CATEGORIES: RatingCategory[] = [
  'bullet',
  'blitz',
  'rapid',
  'classical',
  'daily',
  'puzzles',
];

export function ratingCategoryLabel(category: RatingCategory): string {
  return category === 'puzzles' ? 'Puzzles' : GAME_TYPE_LABELS[category];
}
