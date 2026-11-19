// Rebuilds every analysed game's review with the app's current buildReview
// - no engine needed - and compares it with what the game's own site said.
//
//   npx tsx scripts/review-harness/report.ts [--strength standard] \
//     [--label baseline] [--source chesscom] [--against <earlier label>]
//
// Prints a summary, and writes it with every brilliant, great and miss to
// .review-harness/reports/<label>.json, to compare one run with the next -
// and every move's class to <label>.classes.json, so --against can count
// the moves whose class changed since that run, from what to what.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import type { Color } from 'chess.js';

import { buildReview } from '../../src/domain/review/buildReview';
import { MOVE_CLASSES, type MoveClass } from '../../src/domain/review/types';
import { DATA_DIR, EvaluatedGame } from './games';

const { values } = parseArgs({
  options: {
    strength: { type: 'string', default: 'standard' },
    label: { type: 'string', default: 'latest' },
    source: { type: 'string' },
    against: { type: 'string' },
  },
});

const BANDS = [0, 800, 1200, 1600, 2000] as const;
const bandOf = (rating: number) => `${BANDS.findLast((low) => rating >= low)}+`;

type AccuracyPair = { ours: number; theirs: number; rating: number };

function stats(pairs: AccuracyPair[]) {
  const n = pairs.length;
  if (n === 0) return null;
  const diffs = pairs.map((p) => p.ours - p.theirs);
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const ours = pairs.map((p) => p.ours);
  const theirs = pairs.map((p) => p.theirs);
  const [mo, mt] = [mean(ours), mean(theirs)];
  const cov = mean(pairs.map((p) => (p.ours - mo) * (p.theirs - mt)));
  const sd = (xs: number[], m: number) =>
    Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
  return {
    n,
    meanOurs: round(mo),
    meanTheirs: round(mt),
    bias: round(mean(diffs)),
    meanAbsError: round(mean(diffs.map(Math.abs))),
    correlation: round(cov / (sd(ours, mo) * sd(theirs, mt)), 3),
  };
}

const round = (x: number, places = 1) => Number(x.toFixed(places));

function main() {
  const dir = join(DATA_DIR, 'evals', values.strength!);
  const games: EvaluatedGame[] = readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(readFileSync(join(dir, file), 'utf8')))
    .filter((game) => !values.source || game.source === values.source);

  const accuracy: AccuracyPair[] = [];
  const counts = Object.fromEntries(MOVE_CLASSES.map((c) => [c, 0])) as Record<
    MoveClass,
    number
  >;
  const gamesWith: Partial<Record<MoveClass, number>> = {};
  const standouts: object[] = [];
  // Lichess's judgement of a move against ours: rows lichess's (none, or
  // its mark), columns ours.
  const JUDGED = ['none', 'inaccuracy', 'mistake', 'blunder'] as const;
  const OURS = ['ok', 'inaccuracy', 'mistake', 'miss', 'blunder'] as const;
  const judged = Object.fromEntries(
    JUDGED.map((row) => [row, Object.fromEntries(OURS.map((c) => [c, 0]))]),
  ) as Record<(typeof JUDGED)[number], Record<(typeof OURS)[number], number>>;
  let judgedGames = 0;
  let moves = 0;
  // Each game's moves' classes, by game id.
  const classes: Record<string, MoveClass[]> = {};

  for (const game of games) {
    const review = buildReview(
      game.startFen,
      game.uciMoves.map((uci) => ({ uci })),
      game.evals,
      game.id,
      game.ratings,
    );
    const theirs = game.reference.accuracy;
    for (const color of ['w', 'b'] as Color[]) {
      const side = color === 'w' ? review.white : review.black;
      if (theirs && game.ratings[color] !== null) {
        accuracy.push({
          ours: side.accuracy,
          theirs: theirs[color],
          rating: game.ratings[color]!,
        });
      }
    }
    const judgements = game.reference.judgements;
    if (judgements) judgedGames += 1;
    classes[game.id] = review.moves.map((move) => move.moveClass);
    const seen = new Set<MoveClass>();
    review.moves.forEach((move, index) => {
      if (judgements) {
        const theirs = judgements[index] ?? 'none';
        const ours = (OURS as readonly string[]).includes(move.moveClass)
          ? (move.moveClass as (typeof OURS)[number])
          : 'ok';
        judged[theirs][ours] += 1;
      }
      moves += 1;
      counts[move.moveClass] += 1;
      seen.add(move.moveClass);
      if (['brilliant', 'great', 'miss'].includes(move.moveClass)) {
        standouts.push({
          url: game.url,
          ply: move.ply,
          san: move.san,
          moveClass: move.moveClass,
          fenBefore: move.fenBefore,
          rating: game.ratings[move.color],
        });
      }
    });
    seen.forEach((c) => (gamesWith[c] = (gamesWith[c] ?? 0) + 1));
  }

  const byBand = Object.fromEntries(
    BANDS.map((low) => [
      `${low}+`,
      stats(accuracy.filter((p) => bandOf(p.rating) === `${low}+`)),
    ]),
  );
  const summary = {
    label: values.label,
    games: games.length,
    moves,
    accuracy: { all: stats(accuracy), byBand },
    ...(judgedGames > 0 && {
      lichessJudgements: { games: judgedGames, theirsByOurs: judged },
    }),
    perHundredMoves: Object.fromEntries(
      MOVE_CLASSES.map((c) => [c, round((counts[c] / moves) * 100, 2)]),
    ),
    shareOfGamesWith: Object.fromEntries(
      MOVE_CLASSES.map((c) => [
        c,
        round(((gamesWith[c] ?? 0) / games.length) * 100),
      ]),
    ),
  };

  const reports = join(DATA_DIR, 'reports');
  mkdirSync(reports, { recursive: true });
  writeFileSync(
    join(reports, `${values.label}.json`),
    JSON.stringify({ summary, standouts }, null, 2),
  );
  writeFileSync(
    join(reports, `${values.label}.classes.json`),
    JSON.stringify(classes),
  );
  console.log(JSON.stringify(summary, null, 2));
  if (values.against) printChanges(classes, values.against);
}

// The moves whose class changed since an earlier run, counted by from and to.
function printChanges(classes: Record<string, MoveClass[]>, against: string) {
  const file = join(DATA_DIR, 'reports', `${against}.classes.json`);
  if (!existsSync(file)) throw new Error(`No classes saved for ${against}`);
  const earlier: Record<string, MoveClass[]> = JSON.parse(
    readFileSync(file, 'utf8'),
  );
  const changes = new Map<string, number>();
  let compared = 0;
  for (const [id, now] of Object.entries(classes)) {
    const then = earlier[id];
    if (!then) continue;
    now.forEach((moveClass, index) => {
      compared += 1;
      if (moveClass === then[index]) return;
      const key = `${then[index]} -> ${moveClass}`;
      changes.set(key, (changes.get(key) ?? 0) + 1);
    });
  }
  const changed = [...changes.values()].reduce((a, b) => a + b, 0);
  console.log(
    `\n${changed} of ${compared} moves changed class since ${against}:`,
  );
  [...changes.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([key, n]) => console.log(`  ${key.padEnd(26)}${n}`));
}

main();
