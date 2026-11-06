import { GameType } from '../domain/types';
import { GameCount } from '../network/restClient';

export type GameCountFilter = {
  /** Every result when left out. */
  result?: GameCount['result'];
  /** Every type when left out. */
  gameType?: GameType;
};

/** How many of the games counted match the filter. */
export function countMatching(
  counts: GameCount[],
  { result, gameType }: GameCountFilter,
): number {
  return counts
    .filter(
      (each) =>
        (!result || each.result === result) &&
        (!gameType || each.gameType === gameType),
    )
    .reduce((total, each) => total + each.count, 0);
}
