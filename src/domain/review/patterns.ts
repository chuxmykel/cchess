import { Color } from 'chess.js';

import { type PuzzleTheme, themeOfFact } from '../puzzles/themes';
import type { BadgeKind } from './badges';
import type { Phase, SideDigest } from './digest';

// A player's recent games, read for what keeps happening: where they leave
// pieces hanging, how their play holds up as the clock runs down, how their
// openings go, and the tactic they most often fall to - the puzzles worth
// practising.
export type DigestedGame = {
  gameId: string;
  color: Color;
  endedAt: string | null;
  digest: SideDigest;
};

export type OpeningRecord = {
  name: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
};

export type Patterns = {
  games: number;
  accuracy: number | null;
  // Slips, and pieces left hanging, by phase.
  slipsByPhase: Record<Phase, number>;
  hangingByPhase: Record<Phase, number>;
  missedTactics: number;
  accuracyByClock: { plenty: number; short: number } | null;
  openings: OpeningRecord[];
  // The puzzle themes their slips came down to, the most often first.
  weakThemes: { theme: PuzzleTheme; count: number }[];
};

export type BadgeCounts = Partial<Record<BadgeKind, number>>;

const PHASES: Phase[] = ['opening', 'middlegame', 'endgame'];
const byPhase = () =>
  Object.fromEntries(PHASES.map((phase) => [phase, 0])) as Record<
    Phase,
    number
  >;
const average = (values: number[]) =>
  values.length === 0
    ? null
    : values.reduce((sum, value) => sum + value, 0) / values.length;

export function patternsOf(games: DigestedGame[]): Patterns {
  const slipsByPhase = byPhase();
  const hangingByPhase = byPhase();
  const themes = new Map<PuzzleTheme, number>();
  const openings = new Map<string, OpeningRecord>();
  for (const { digest } of games) {
    for (const slip of digest.slips) {
      slipsByPhase[slip.phase] += 1;
      if (slip.facts.includes('hangs')) hangingByPhase[slip.phase] += 1;
      // One theme a slip: the first its facts come to.
      const theme = slip.facts.map(themeOfFact).find((t) => t !== null);
      if (theme) themes.set(theme, (themes.get(theme) ?? 0) + 1);
    }
    if (digest.opening) {
      const record = openings.get(digest.opening) ?? {
        name: digest.opening,
        games: 0,
        wins: 0,
        draws: 0,
        losses: 0,
      };
      record.games += 1;
      if (digest.result === 'win') record.wins += 1;
      if (digest.result === 'draw') record.draws += 1;
      if (digest.result === 'loss') record.losses += 1;
      openings.set(digest.opening, record);
    }
  }
  const clocked = games
    .map((game) => game.digest.accuracyByClock)
    .filter((clock): clock is { plenty: number; short: number } => !!clock);
  return {
    games: games.length,
    accuracy: average(games.map((game) => game.digest.accuracy)),
    slipsByPhase,
    hangingByPhase,
    missedTactics: games.reduce(
      (sum, game) => sum + game.digest.missedTactics,
      0,
    ),
    accuracyByClock:
      clocked.length > 0
        ? {
            plenty: average(clocked.map((clock) => clock.plenty)) ?? 0,
            short: average(clocked.map((clock) => clock.short)) ?? 0,
          }
        : null,
    openings: [...openings.values()].sort((a, b) => b.games - a.games),
    weakThemes: [...themes.entries()]
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count),
  };
}
