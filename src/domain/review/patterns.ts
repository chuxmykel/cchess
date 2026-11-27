import { Color } from 'chess.js';

import { type PuzzleTheme, themeOfFact } from '../puzzles/themes';
import type { Phase, SideDigest } from './digest';
import { MARK_GLYPHS, type MarkGlyph } from './marks';
import { STANDING, TIME } from './thresholds';

// A player's reviewed games over a period, read for what keeps happening:
// how accurate they are, and in which phase; the marks they earn; how often
// they win the positions they're winning and save the ones they're losing;
// the tactics they miss; how their play holds up as the clock runs down;
// and how their openings go - with the puzzles worth practising.
export type DigestedGame = {
  gameId: string;
  color: Color;
  endedAt: string | null;
  digest: SideDigest;
};

export type Results = {
  games: number;
  wins: number;
  draws: number;
  losses: number;
};

export type OpeningRecord = Results & {
  name: string;
  color: Color;
  // Average accuracy in its games.
  accuracy: number;
};

export type Patterns = {
  games: number;
  accuracy: number | null;
  // Each game's accuracy, oldest first.
  accuracyTrend: { gameId: string; endedAt: string | null; accuracy: number }[];
  accuracyByPhase: Record<Phase, number | null>;
  // The marks earned, on average a game.
  marksPerGame: Record<MarkGlyph, number>;
  // Slips, and pieces left hanging, by phase.
  slipsByPhase: Record<Phase, number>;
  hangingByPhase: Record<Phase, number>;
  // Games where they were winning, and how many they won; where they were
  // losing, and how many they didn't lose.
  converting: { chances: number; won: number };
  saving: { chances: number; saved: number };
  missedTactics: number;
  // The puzzle themes their slips came down to, the most often first.
  weakThemes: { theme: PuzzleTheme; count: number }[];
  accuracyByClock: { plenty: number; short: number } | null;
  // Slips with under a quarter of the clock left.
  timeTroubleSlips: number;
  results: Record<Color, Results>;
  // Their openings, the most played first.
  openings: OpeningRecord[];
};

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
const noResults = (): Results => ({ games: 0, wins: 0, draws: 0, losses: 0 });

function tally(results: Results, result: SideDigest['result']): void {
  results.games += 1;
  if (result === 'win') results.wins += 1;
  if (result === 'draw') results.draws += 1;
  if (result === 'loss') results.losses += 1;
}

export function patternsOf(games: DigestedGame[]): Patterns {
  const slipsByPhase = byPhase();
  const hangingByPhase = byPhase();
  const themes = new Map<PuzzleTheme, number>();
  const openings = new Map<string, OpeningRecord & { accuracies: number[] }>();
  const results: Record<Color, Results> = { w: noResults(), b: noResults() };
  const converting = { chances: 0, won: 0 };
  const saving = { chances: 0, saved: 0 };
  const marks = Object.fromEntries(MARK_GLYPHS.map((g) => [g, 0])) as Record<
    MarkGlyph,
    number
  >;
  let timeTroubleSlips = 0;

  for (const { color, digest } of games) {
    tally(results[color], digest.result);
    for (const glyph of MARK_GLYPHS) marks[glyph] += digest.marks[glyph];
    for (const slip of digest.slips) {
      slipsByPhase[slip.phase] += 1;
      if (slip.facts.includes('hangs')) hangingByPhase[slip.phase] += 1;
      if (slip.clockShare !== null && slip.clockShare < TIME.lowTimeShare) {
        timeTroubleSlips += 1;
      }
      // One theme a slip: the first its facts come to.
      const theme = slip.facts.map(themeOfFact).find((t) => t !== null);
      if (theme) themes.set(theme, (themes.get(theme) ?? 0) + 1);
    }
    if (digest.chances.high >= STANDING.winning) {
      converting.chances += 1;
      if (digest.result === 'win') converting.won += 1;
    }
    if (digest.chances.low < STANDING.losing) {
      saving.chances += 1;
      if (digest.result !== 'loss') saving.saved += 1;
    }
    if (digest.opening) {
      const key = `${color}:${digest.opening}`;
      const record = openings.get(key) ?? {
        name: digest.opening,
        color,
        accuracy: 0,
        accuracies: [],
        ...noResults(),
      };
      tally(record, digest.result);
      record.accuracies.push(digest.accuracy);
      openings.set(key, record);
    }
  }

  const clocked = games
    .map((game) => game.digest.accuracyByClock)
    .filter((clock): clock is { plenty: number; short: number } => !!clock);
  const perGame = (count: number) => (games.length ? count / games.length : 0);
  return {
    games: games.length,
    accuracy: average(games.map((game) => game.digest.accuracy)),
    accuracyTrend: [...games]
      .sort((a, b) => (a.endedAt ?? '').localeCompare(b.endedAt ?? ''))
      .map(({ gameId, endedAt, digest }) => ({
        gameId,
        endedAt,
        accuracy: digest.accuracy,
      })),
    accuracyByPhase: Object.fromEntries(
      PHASES.map((phase) => [
        phase,
        average(
          games
            .map((game) => game.digest.accuracyByPhase[phase])
            .filter((value): value is number => value !== null),
        ),
      ]),
    ) as Record<Phase, number | null>,
    marksPerGame: Object.fromEntries(
      MARK_GLYPHS.map((glyph) => [glyph, perGame(marks[glyph])]),
    ) as Record<MarkGlyph, number>,
    slipsByPhase,
    hangingByPhase,
    converting,
    saving,
    missedTactics: games.reduce(
      (sum, game) => sum + game.digest.missedTactics,
      0,
    ),
    weakThemes: [...themes.entries()]
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count),
    accuracyByClock:
      clocked.length > 0
        ? {
            plenty: average(clocked.map((clock) => clock.plenty)) ?? 0,
            short: average(clocked.map((clock) => clock.short)) ?? 0,
          }
        : null,
    timeTroubleSlips,
    results,
    openings: [...openings.values()]
      .map(({ accuracies, ...record }) => ({
        ...record,
        accuracy: average(accuracies) ?? 0,
      }))
      .sort((a, b) => b.games - a.games),
  };
}
