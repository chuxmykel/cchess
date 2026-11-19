// Analysed lichess games - from its open database, their moves marked with
// lichess's own judgements (?! inaccuracy, ? mistake, ?? blunder) - as
// harness games.
//
//   npx tsx scripts/review-harness/importLichess.ts --pgn <games.pgn>
//
// Writes .review-harness/lichess-<name of the PGN>.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parseArgs } from 'node:util';

import { parseImport } from '../../src/domain/pgnImport';
import { DATA_DIR, HarnessGame, seededShuffle } from './games';

const { values } = parseArgs({ options: { pgn: { type: 'string' } } });
if (!values.pgn) throw new Error('--pgn <games.pgn> is required');

const JUDGEMENTS = {
  '?!': 'inaccuracy',
  '?': 'mistake',
  '??': 'blunder',
} as const;

// Each move's judgement, by its index among the game's moves: the suffix
// lichess puts on its SAN.
function judgementsOf(pgn: string): HarnessGame['reference']['judgements'] {
  const moveText = pgn
    .split('\n')
    .filter((line) => !line.startsWith('['))
    .join(' ')
    .replace(/\{[^}]*\}/g, ' ');
  const tokens = moveText
    .split(/\s+/)
    .filter(
      (token) =>
        token &&
        !/^\d+\.+$/.test(token) &&
        !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token),
    );
  const judgements: HarnessGame['reference']['judgements'] = {};
  tokens.forEach((token, index) => {
    const suffix = token.match(/[?!]+$/)?.[0];
    if (suffix && suffix in JUDGEMENTS) {
      judgements[index] = JUDGEMENTS[suffix as keyof typeof JUDGEMENTS];
    }
  });
  return judgements;
}

function main() {
  const text = readFileSync(values.pgn!, 'utf8');
  const pgns = text.split(/\n\n(?=\[Event )/).filter((pgn) => pgn.trim());
  const games: HarnessGame[] = [];
  for (const pgn of pgns) {
    const site = pgn.match(/\[Site "([^"]+)"\]/)?.[1] ?? '';
    const parsed = parseImport(pgn);
    if (parsed.ok === false || parsed.uciMoves.length < 10) continue;
    games.push({
      id: `lichess-${site.split('/').at(-1)}`,
      source: 'lichess',
      url: site,
      timeClass: pgn.match(/\[TimeControl "([^"]+)"\]/)?.[1] ?? '',
      startFen: parsed.startFen,
      uciMoves: parsed.uciMoves,
      ratings: {
        w: parsed.game?.white.rating ?? null,
        b: parsed.game?.black.rating ?? null,
      },
      result: parsed.game?.result ?? null,
      reference: { judgements: judgementsOf(pgn) },
    });
  }
  const out = join(
    DATA_DIR,
    `lichess-${basename(values.pgn!).replace(/\.pgn$/, '')}.json`,
  );
  writeFileSync(out, JSON.stringify(seededShuffle(games)));
  const judged = games.reduce(
    (sum, game) => sum + Object.keys(game.reference.judgements!).length,
    0,
  );
  console.log(
    `${pgns.length} games, ${games.length} kept, ${judged} judged moves -> ${out}`,
  );
}

main();
