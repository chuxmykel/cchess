// Analyses games as the app's review does - the same engine build, search
// and runner - and keeps each game's evals, so the review can be rebuilt
// from them as often as the classification changes, without the engine.
//
//   npx tsx scripts/review-harness/analyse.ts --games <file.json> \
//     [--limit 300] [--jobs 8] [--strength standard]
//
// --games is a JSON array of HarnessGame without evals (see games.ts).
// Evals are written to .review-harness/evals/<strength>/<id>.json; games
// already there are skipped, so a run cut short carries on.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { Chess } from 'chess.js';

import { ENGINE_VERSION } from '../../src/constants/engine';
import {
  REVIEW_LINE_MOVES,
  REVIEW_MULTI_PV,
  REVIEW_SEARCH,
  ReviewStrength,
} from '../../src/constants/review';
import type { PositionEval } from '../../src/domain/review/types';
import { runReview } from '../../src/engine/reviewRunner';
import { DATA_DIR, EvaluatedGame, HarnessGame } from './games';
import { ensureEngine, startEngine } from './nodeEngine';

const { values } = parseArgs({
  options: {
    games: { type: 'string' },
    limit: { type: 'string' },
    jobs: { type: 'string', default: '8' },
    strength: { type: 'string', default: 'standard' },
  },
});
if (!values.games) throw new Error('--games <file.json> is required');
const strength = values.strength as ReviewStrength;
if (!REVIEW_SEARCH[strength]) throw new Error(`unknown strength ${strength}`);

function fensOf(game: HarnessGame): string[] {
  const chess = new Chess(game.startFen);
  const fens = [game.startFen];
  for (const uci of game.uciMoves) {
    chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci[4],
    });
    fens.push(chess.fen());
  }
  return fens;
}

async function main() {
  const outDir = join(DATA_DIR, 'evals', strength);
  mkdirSync(outDir, { recursive: true });
  const all: HarnessGame[] = JSON.parse(readFileSync(values.games!, 'utf8'));
  const limit = values.limit ? Number(values.limit) : all.length;
  const todo = all
    .slice(0, limit)
    .filter((game) => !existsSync(join(outDir, `${game.id}.json`)));
  console.log(`${todo.length} games to analyse (${limit - todo.length} done)`);

  const glue = await ensureEngine(join(DATA_DIR, 'engine'));
  const jobs = Number(values.jobs);
  const started = Date.now();
  let finished = 0;

  async function worker() {
    const { engine, close } = startEngine(glue);
    try {
      for (let game = todo.shift(); game; game = todo.shift()) {
        const fens = fensOf(game);
        const evals: (PositionEval | null)[] = fens.map(() => null);
        await runReview({
          engines: [engine],
          fens,
          known: evals,
          search: { multiPv: REVIEW_MULTI_PV, limit: REVIEW_SEARCH[strength] },
          onEval: (index, positionEval) => {
            evals[index] = {
              ...positionEval,
              pv: positionEval.pv.slice(0, REVIEW_LINE_MOVES),
            };
          },
        });
        const evaluated: EvaluatedGame = {
          ...game,
          engine: ENGINE_VERSION,
          strength,
          evals: evals as PositionEval[],
        };
        writeFileSync(
          join(outDir, `${game.id}.json`),
          JSON.stringify(evaluated),
        );
        finished += 1;
        const perGame = (Date.now() - started) / 1000 / finished;
        const left = Math.round((perGame * todo.length) / 60);
        console.log(
          `${finished} done, ${todo.length} waiting, ~${left} min left`,
        );
      }
    } finally {
      close();
    }
  }

  await Promise.all(Array.from({ length: jobs }, worker));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
