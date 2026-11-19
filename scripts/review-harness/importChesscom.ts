// A chess.com player's games, from the public API (no login), as harness
// games: those chess.com has reviewed - with each side's accuracy - from the
// usual start, in a seeded random order.
//
//   npx tsx scripts/review-harness/importChesscom.ts --user <username>
//
// Writes .review-harness/chesscom-<user>.json. Months already fetched (in
// .review-harness/chesscom/<user>/) aren't fetched again, but the current
// month always is.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { DEFAULT_POSITION } from 'chess.js';

import { parseImport } from '../../src/domain/pgnImport';
import { DATA_DIR, HarnessGame, seededShuffle } from './games';

const { values } = parseArgs({ options: { user: { type: 'string' } } });
const user = values.user?.toLowerCase();
if (!user) throw new Error('--user <chess.com username> is required');

// chess.com asks automated clients for a User-Agent; a generic one.
const HEADERS = { 'User-Agent': 'cchess-review-harness' };

async function getJson(url: string) {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

type ChesscomGame = {
  uuid: string;
  url: string;
  pgn?: string;
  rules: string;
  time_class: string;
  initial_setup?: string;
  accuracies?: { white: number; black: number };
  white: { rating: number };
  black: { rating: number };
};

async function main() {
  const monthsDir = join(DATA_DIR, 'chesscom', user!);
  mkdirSync(monthsDir, { recursive: true });
  const { archives } = await getJson(
    `https://api.chess.com/pub/player/${user}/games/archives`,
  );
  const current = archives.at(-1);
  const games: ChesscomGame[] = [];
  for (const url of archives as string[]) {
    const file = join(monthsDir, url.split('/').slice(-2).join('-') + '.json');
    if (!existsSync(file) || url === current) {
      writeFileSync(file, JSON.stringify(await getJson(url)));
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    games.push(...JSON.parse(readFileSync(file, 'utf8')).games);
  }

  const harnessGames: HarnessGame[] = [];
  for (const game of games) {
    if (game.rules !== 'chess' || !game.accuracies || !game.pgn) continue;
    if (!game.initial_setup?.startsWith(DEFAULT_POSITION.split(' - ')[0]))
      continue;
    const parsed = parseImport(game.pgn);
    if (parsed.ok === false || parsed.uciMoves.length < 10) continue;
    harnessGames.push({
      id: `chesscom-${game.uuid}`,
      source: 'chesscom',
      url: game.url,
      timeClass: game.time_class,
      startFen: parsed.startFen,
      uciMoves: parsed.uciMoves,
      ratings: { w: game.white.rating, b: game.black.rating },
      result: parsed.game?.result ?? null,
      reference: {
        accuracy: { w: game.accuracies.white, b: game.accuracies.black },
      },
    });
  }
  const out = join(DATA_DIR, `chesscom-${user}.json`);
  writeFileSync(out, JSON.stringify(seededShuffle(harnessGames)));
  console.log(
    `${games.length} games, ${harnessGames.length} reviewed from the start -> ${out}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
