// Where our slips (inaccuracy, mistake, blunder) part from lichess's: each
// lichess game's moves judged four ways, each against lichess's own marks.
//
//   A  lichess's evals, lichess's thresholds - a check that its evals and
//      marks are read right: these should agree almost entirely
//   B  lichess's evals, our thresholds - the difference from A is our rules
//   C  our engine's evals, our thresholds - from B, the engine
//   D  our whole classifier (buildReview) - from C, our other rules: miss,
//      material given up, best/brilliant/great
//
//   npx tsx scripts/review-harness/slipSources.ts --pgn <judged.pgn>
//
// Needs the games' evals from analyse.ts (standard strength).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { Chess, Color } from 'chess.js';

import type { EngineScore } from '../../src/domain/evalScore';
import { buildReview } from '../../src/domain/review/buildReview';
import { winPercent } from '../../src/domain/review/winChances';
import { DATA_DIR, EvaluatedGame } from './games';

const { values } = parseArgs({ options: { pgn: { type: 'string' } } });
if (!values.pgn) throw new Error('--pgn <judged.pgn> is required');

type Slip = 'none' | 'inaccuracy' | 'mistake' | 'blunder';
const SLIPS: Slip[] = ['none', 'inaccuracy', 'mistake', 'blunder'];
const MARKS: Record<string, Slip> = {
  '?!': 'inaccuracy',
  '?': 'mistake',
  '??': 'blunder',
};

// Winning chances lost (0-100) at which each slip starts.
const LICHESS = { inaccuracy: 5, mistake: 10, blunder: 15 };
const OURS = { inaccuracy: 5, mistake: 10, blunder: 20 };

function slipOf(loss: number, thresholds: typeof OURS): Slip {
  if (loss >= thresholds.blunder) return 'blunder';
  if (loss >= thresholds.mistake) return 'mistake';
  if (loss >= thresholds.inaccuracy) return 'inaccuracy';
  return 'none';
}

function scoreOf(raw: string): EngineScore {
  if (raw.startsWith('#')) {
    const moves = Number(raw.slice(1));
    return {
      kind: 'mate',
      moves: Math.abs(moves),
      winner: moves < 0 ? 'b' : 'w',
    };
  }
  return { kind: 'cp', cp: Math.round(Number(raw) * 100) };
}

// A game's moves as lichess wrote them: each one's mark, and the eval after
// it (null where it gives none - the mating move, say).
function lichessMoves(pgn: string) {
  const text = pgn
    .split('\n')
    .filter((line) => !line.startsWith('['))
    .join(' ');
  const moves: { mark: Slip; evalAfter: EngineScore | null }[] = [];
  const pattern = /\{([^}]*)\}|(\S+)/g;
  for (const [, comment, token] of text.matchAll(pattern)) {
    if (comment !== undefined) {
      const raw = comment.match(/\[%eval ([^\]\s]+)\]/)?.[1];
      if (raw && moves.length > 0) moves.at(-1)!.evalAfter = scoreOf(raw);
      continue;
    }
    if (/^\d+\.+$/.test(token) || /^(1-0|0-1|1\/2-1\/2|\*)$/.test(token)) {
      continue;
    }
    const suffix = token.match(/[?!]+$/)?.[0] ?? '';
    moves.push({ mark: MARKS[suffix] ?? 'none', evalAfter: null });
  }
  return moves;
}

type Table = Record<Slip, Record<Slip, number>>;
const emptyTable = (): Table =>
  Object.fromEntries(
    SLIPS.map((row) => [row, Object.fromEntries(SLIPS.map((c) => [c, 0]))]),
  ) as Table;

function main() {
  const evalsDir = join(DATA_DIR, 'evals', 'standard');
  const pgns = readFileSync(values.pgn!, 'utf8')
    .split(/\n\n(?=\[Event )/)
    .filter((pgn) => pgn.trim());
  const tables = {
    A: emptyTable(),
    B: emptyTable(),
    C: emptyTable(),
    D: emptyTable(),
    // Rows: lichess's evals, our thresholds (B); columns: our engine's evals,
    // our thresholds (C) - the engine alone.
    E: emptyTable(),
    // Rows: our engine's evals, our thresholds (C); columns: our whole
    // classifier (D) - our other rules alone.
    F: emptyTable(),
  };
  const rowsOf = {
    A: 'lichess',
    B: 'lichess',
    C: 'lichess',
    D: 'lichess',
    E: 'their eval',
    F: 'threshold',
  };
  let games = 0;

  for (const pgn of pgns) {
    const id = `lichess-${pgn.match(/\[Site "[^"]*\/([^"/]+)"\]/)?.[1]}`;
    const file = join(evalsDir, `${id}.json`);
    if (!existsSync(file)) continue;
    const game: EvaluatedGame = JSON.parse(readFileSync(file, 'utf8'));
    const theirs = lichessMoves(pgn);
    if (theirs.length !== game.uciMoves.length) {
      throw new Error(
        `${id}: ${theirs.length} moves, ${game.uciMoves.length} expected`,
      );
    }
    games += 1;
    const review = buildReview(
      game.startFen,
      game.uciMoves.map((uci) => ({ uci })),
      game.evals,
      game.id,
      game.ratings,
    );
    const chess = new Chess(game.startFen);
    // Before the first move, lichess's own start: about level.
    let lichessBefore: EngineScore | null = { kind: 'cp', cp: 20 };
    game.uciMoves.forEach((uci, index) => {
      const color = chess.turn() as Color;
      chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci[4],
      });
      const { mark } = theirs[index];
      // The mating move gets no eval from lichess: mate, for the mover.
      const lichessAfter =
        theirs[index].evalAfter ??
        (chess.isCheckmate()
          ? ({ kind: 'mate', moves: 0, winner: color } as EngineScore)
          : null);
      if (lichessBefore && lichessAfter) {
        const loss = Math.max(
          0,
          winPercent(lichessBefore, color) - winPercent(lichessAfter, color),
        );
        tables.A[mark][slipOf(loss, LICHESS)] += 1;
        const byTheirEvals = slipOf(loss, OURS);
        tables.B[mark][byTheirEvals] += 1;
        const ourLoss = Math.max(
          0,
          winPercent(game.evals[index].score, color) -
            winPercent(game.evals[index + 1].score, color),
        );
        const byOurEvals = slipOf(ourLoss, OURS);
        tables.C[mark][byOurEvals] += 1;
        tables.E[byTheirEvals][byOurEvals] += 1;
        const moveClass = review.moves[index].moveClass;
        const ours: Slip =
          moveClass === 'miss'
            ? 'mistake'
            : SLIPS.includes(moveClass as Slip)
              ? (moveClass as Slip)
              : 'none';
        tables.D[mark][ours] += 1;
        tables.F[byOurEvals][ours] += 1;
      }
      lichessBefore = lichessAfter;
    });
  }

  console.log(`${games} games\n`);
  for (const [name, table] of Object.entries(tables)) {
    let agree = 0;
    let total = 0;
    const rows = SLIPS.map((row) => {
      const cells = SLIPS.map((c) => table[row][c]);
      agree += table[row][row];
      total += cells.reduce((a, b) => a + b, 0);
      return `  ${row.padEnd(11)}${cells.map((n) => String(n).padStart(11)).join('')}`;
    });
    console.log(
      `${name}  (agree ${((agree / total) * 100).toFixed(1)}% of ${total} moves)`,
    );
    console.log(
      `  ${rowsOf[name as keyof typeof rowsOf].padEnd(11)}${SLIPS.map((c) => c.padStart(11)).join('')}`,
    );
    console.log(rows.join('\n') + '\n');
  }
}

main();
