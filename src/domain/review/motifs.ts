import { Chess, Color, Move, PieceSymbol, Square } from 'chess.js';

import type { EngineScore } from '../evalScore';
import { otherColor } from '../players';
import type { MoveClass, MoveFact, PieceName } from './types';

// What a review can say about a move, worked out from the position and the
// engine's lines with chess.js: material won or lost along a line, mates,
// pieces left hanging, forks, pins and trapped pieces - and, for a good
// move, the ideas behind it. No engine of its own: the lines are the
// engine's.

export const PIECE_VALUE: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const PIECE_NAME: Record<Exclude<PieceSymbol, 'k'>, PieceName> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
};

export function pieceName(type: PieceSymbol): PieceName {
  return PIECE_NAME[type === 'k' ? 'q' : type];
}

// How far ahead a side is in material, in pawns.
export function materialBalance(fen: string, color: Color): number {
  let balance = 0;
  for (const char of fen.split(' ')[0]) {
    const type = char.toLowerCase() as PieceSymbol;
    if (!(type in PIECE_VALUE)) continue;
    const owner: Color = char === type ? 'b' : 'w';
    balance += (owner === color ? 1 : -1) * PIECE_VALUE[type];
  }
  return balance;
}

// A line of UCI moves played out from a position, as far as it's legal.
export function playLine(fen: string, line: string[], max = line.length) {
  const chess = new Chess(fen);
  const moves: Move[] = [];
  for (const uci of line.slice(0, max)) {
    try {
      moves.push(
        chess.move({
          from: uci.slice(0, 2),
          to: uci.slice(2, 4),
          promotion: uci[4],
        }),
      );
    } catch {
      break;
    }
  }
  return moves;
}

// How deep into a line material is counted - far enough for an exchange to
// finish, not so far the engine's guesses count.
const LINE_PLIES = 10;

type LineMaterial = {
  // What the side gains over the line, in pawns: less than 0 for a loss.
  gain: number;
  // The most valuable piece the side lost along it, and that it took.
  lost: { type: PieceSymbol; ply: number } | null;
  won: { type: PieceSymbol; ply: number } | null;
};

export function lineMaterial(
  fen: string,
  line: string[],
  color: Color,
): LineMaterial {
  const moves = playLine(fen, line, LINE_PLIES);
  const result: LineMaterial = { gain: 0, lost: null, won: null };
  if (moves.length === 0) return result;
  result.gain =
    materialBalance(moves[moves.length - 1].after, color) -
    materialBalance(fen, color);
  moves.forEach((move, ply) => {
    if (!move.captured) return;
    const key = move.color === color ? 'won' : 'lost';
    const best = result[key];
    if (!best || PIECE_VALUE[move.captured] > PIECE_VALUE[best.type]) {
      result[key] = { type: move.captured, ply };
    }
  });
  return result;
}

// A piece the opponent can take for less than it's worth: attacked and not
// defended, or attacked by something cheaper.
export function isLoose(chess: Chess, square: Square): boolean {
  const piece = chess.get(square);
  if (!piece || piece.type === 'k') return false;
  const attackers = chess.attackers(square, otherColor(piece.color));
  if (attackers.length === 0) return false;
  if (chess.attackers(square, piece.color).length === 0) return true;
  return attackers.some(
    (from) => PIECE_VALUE[chess.get(from)!.type] < PIECE_VALUE[piece.type],
  );
}

// Every piece of a side that a piece on this square attacks.
function attackedBy(chess: Chess, from: Square, victim: Color): Square[] {
  const targets: Square[] = [];
  for (const row of chess.board()) {
    for (const cell of row) {
      if (!cell || cell.color !== victim) continue;
      if (chess.attackers(cell.square, otherColor(victim)).includes(from)) {
        targets.push(cell.square);
      }
    }
  }
  return targets;
}

// A piece hitting two that are worth more than it - or the king and another.
export function isFork(chess: Chess, from: Square): boolean {
  const forker = chess.get(from);
  if (!forker) return false;
  const targets = attackedBy(chess, from, otherColor(forker.color)).filter(
    (square) => {
      const piece = chess.get(square)!;
      return (
        piece.type === 'k' ||
        PIECE_VALUE[piece.type] > PIECE_VALUE[forker.type] ||
        (piece.type !== 'p' && isLoose(chess, square))
      );
    },
  );
  return targets.length >= 2;
}

const DIRECTIONS: Record<'b' | 'r' | 'q', [number, number][]> = {
  b: [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ],
  r: [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ],
  q: [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ],
};

function squareAt(file: number, rank: number): Square | null {
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return `${'abcdefgh'[file]}${rank + 1}` as Square;
}

// A slider lining up two of the other side's pieces, the one behind worth
// more (a pin) or the one in front the king or queen (a skewer): the piece
// it wins, or null.
export function pinnedOrSkewered(
  chess: Chess,
  from: Square,
): PieceSymbol | null {
  const slider = chess.get(from);
  if (!slider || !(slider.type in DIRECTIONS)) return null;
  const file = from.charCodeAt(0) - 97;
  const rank = Number(from[1]) - 1;
  for (const [df, dr] of DIRECTIONS[slider.type as 'b' | 'r' | 'q']) {
    const hit: { type: PieceSymbol; color: Color }[] = [];
    for (let step = 1; hit.length < 2; step++) {
      const square = squareAt(file + df * step, rank + dr * step);
      if (!square) break;
      const piece = chess.get(square);
      if (!piece) continue;
      if (piece.color === slider.color) break;
      hit.push(piece);
    }
    if (hit.length < 2) continue;
    const [front, back] = hit;
    const frontValue = front.type === 'k' ? 100 : PIECE_VALUE[front.type];
    const backValue = back.type === 'k' ? 100 : PIECE_VALUE[back.type];
    if (backValue > frontValue && frontValue > PIECE_VALUE[slider.type]) {
      return front.type;
    }
    if (
      (front.type === 'k' || front.type === 'q') &&
      frontValue > backValue &&
      backValue >= 3
    ) {
      return back.type;
    }
  }
  return null;
}

// Where a piece taken along a line stood before the line began: followed back
// from the square it was taken on, through its own moves.
function squareBeforeLine(moves: Move[], takenAt: number): Square {
  let square = moves[takenAt].to;
  for (let i = takenAt - 1; i >= 0; i--) {
    if (moves[i].to === square && moves[i].color !== moves[takenAt].color) {
      square = moves[i].from;
    }
  }
  return square;
}

// A piece with nowhere to go: every move it has leaves it loose.
function isTrapped(chess: Chess, square: Square): boolean {
  const piece = chess.get(square);
  if (!piece || piece.type === 'p' || piece.type === 'k') return false;
  if (chess.turn() !== piece.color) return false;
  for (const move of chess.moves({ square, verbose: true })) {
    chess.move(move);
    const loose = isLoose(chess, move.to);
    chess.undo();
    if (!loose) return false;
  }
  return true;
}

// Passed: no pawn of the other side ahead of it on its own file or either
// next to it.
function isPassed(chess: Chess, square: Square): boolean {
  const pawn = chess.get(square);
  if (!pawn || pawn.type !== 'p') return false;
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  const ahead = pawn.color === 'w' ? 1 : -1;
  for (let f = file - 1; f <= file + 1; f++) {
    for (let r = rank + ahead; r >= 0 && r <= 7; r += ahead) {
      const at = squareAt(f, r);
      const other = at && chess.get(at);
      if (other && other.type === 'p' && other.color !== pawn.color) {
        return false;
      }
    }
  }
  return true;
}

const BAD: MoveClass[] = ['inaccuracy', 'mistake', 'miss', 'blunder'];
const CENTRE: Square[] = ['d4', 'e4', 'd5', 'e5'];

export type MoveContext = {
  fenBefore: string;
  fenAfter: string;
  move: Move;
  moveClass: MoveClass;
  scoreBefore: EngineScore;
  scoreAfter: EngineScore;
  // The best line from before the move, and the line answering it.
  bestLine: string[];
  replyLine: string[];
  // 1 for white's first move.
  ply: number;
  opening: string | null;
};

// What a move did, most worth saying first.
export function moveFacts(context: MoveContext): MoveFact[] {
  if (context.moveClass === 'book') {
    return [{ kind: 'book', opening: context.opening }];
  }
  return BAD.includes(context.moveClass)
    ? badMoveFacts(context)
    : goodMoveFacts(context);
}

function mateFor(score: EngineScore, color: Color): number | null {
  return score.kind === 'mate' && score.winner === color ? score.moves : null;
}

function badMoveFacts(context: MoveContext): MoveFact[] {
  const { move, fenAfter, fenBefore, scoreBefore, scoreAfter } = context;
  const color = move.color;
  const opponent = otherColor(color);
  const facts: MoveFact[] = [];

  const mateAgainst = mateFor(scoreAfter, opponent);
  if (mateAgainst !== null && mateFor(scoreBefore, opponent) === null) {
    facts.push({ kind: 'allowsMate', moves: mateAgainst });
  }
  const hadMate = mateFor(scoreBefore, color);
  if (hadMate !== null && mateFor(scoreAfter, color) === null) {
    facts.push({ kind: 'missesMate', moves: hadMate });
  }

  // What the opponent wins in answer, over what best play would have kept.
  const reply = lineMaterial(fenAfter, context.replyLine, color);
  const bestLine = lineMaterial(fenBefore, context.bestLine, color);
  const playedGain =
    reply.gain +
    (move.captured ? PIECE_VALUE[move.captured] : 0) +
    (move.promotion ? PIECE_VALUE[move.promotion] - 1 : 0);
  if (reply.lost && playedGain < 0 && bestLine.gain - playedGain >= 2) {
    const lost = pieceName(reply.lost.type);
    const replyMoves = playLine(fenAfter, context.replyLine, LINE_PLIES);
    const afterReply = replyMoves[0] ? new Chess(replyMoves[0].after) : null;
    const lostAt =
      reply.lost.ply > 0 ? squareBeforeLine(replyMoves, reply.lost.ply) : null;
    if (reply.lost.ply === 0 && replyMoves[0]?.captured) {
      facts.push({ kind: 'hangs', piece: pieceName(replyMoves[0].captured) });
    } else if (afterReply && isFork(afterReply, replyMoves[0].to)) {
      facts.push({ kind: 'allowsFork', piece: pieceName(replyMoves[0].piece) });
    } else if (afterReply && pinnedOrSkewered(afterReply, replyMoves[0].to)) {
      facts.push({ kind: 'allowsPin', piece: lost });
    } else if (afterReply && lostAt && isTrapped(afterReply, lostAt)) {
      facts.push({ kind: 'trapped', piece: lost });
    } else {
      facts.push({ kind: 'losesMaterial', piece: lost });
    }
  } else if (bestLine.won && bestLine.gain - playedGain >= 2) {
    facts.push({ kind: 'missesWin', piece: pieceName(bestLine.won.type) });
  }
  if (facts.length === 0) facts.push({ kind: 'slips' });
  return facts;
}

function goodMoveFacts(context: MoveContext): MoveFact[] {
  const { move, fenBefore, fenAfter, scoreAfter, ply } = context;
  const color = move.color;
  const facts: MoveFact[] = [];
  const after = new Chess(fenAfter);
  const before = new Chess(fenBefore);

  if (after.isCheckmate()) return [{ kind: 'mates' }];
  const mating = mateFor(scoreAfter, color);
  if (mating !== null && mating > 0) {
    facts.push({ kind: 'forcesMate', moves: mating });
  }

  const sacrificed = isSacrifice(move);
  if (sacrificed && context.moveClass === 'brilliant') {
    facts.push({ kind: 'sacrifice', piece: pieceName(move.piece) });
  }
  const reply = lineMaterial(fenAfter, context.replyLine, color);
  const taken = move.captured ? PIECE_VALUE[move.captured] : 0;
  const gain = reply.gain + taken;
  if (gain >= 2) {
    const won =
      reply.won && (!move.captured || PIECE_VALUE[reply.won.type] > taken)
        ? reply.won.type
        : (move.captured ?? reply.won?.type ?? 'p');
    if (isFork(after, move.to)) {
      facts.push({ kind: 'fork', piece: pieceName(move.piece) });
    } else if (pinnedOrSkewered(after, move.to)) {
      facts.push({
        kind: 'pin',
        piece: pieceName(pinnedOrSkewered(after, move.to)!),
      });
    } else if (
      move.captured &&
      PIECE_VALUE[move.captured] >= 3 &&
      before.attackers(move.to, otherColor(color)).length === 0
    ) {
      facts.push({ kind: 'takesFree', piece: pieceName(move.captured) });
    } else {
      facts.push({ kind: 'winsMaterial', piece: pieceName(won) });
    }
  }
  if (isLoose(before, move.from) && !isLoose(after, move.to) && !sacrificed) {
    facts.push({ kind: 'saves', piece: pieceName(move.piece) });
  }
  if (move.isKingsideCastle()) facts.push({ kind: 'castles', side: 'king' });
  if (move.isQueensideCastle()) facts.push({ kind: 'castles', side: 'queen' });
  if (
    move.captured &&
    PIECE_VALUE[move.captured] === PIECE_VALUE[move.piece] &&
    materialBalance(fenBefore, color) >= 2
  ) {
    facts.push({ kind: 'trades' });
  }
  if (move.piece === 'p' && isPassed(after, move.to) && ply > 20) {
    facts.push({ kind: 'passedPawn' });
  }
  if (ply <= 24) {
    const homeRank = color === 'w' ? '1' : '8';
    if (
      (move.piece === 'n' || move.piece === 'b') &&
      move.from[1] === homeRank
    ) {
      facts.push({ kind: 'develops', piece: pieceName(move.piece) });
    } else if (move.piece === 'p' && CENTRE.includes(move.to)) {
      facts.push({ kind: 'centre' });
    }
  }
  if (move.san.includes('+')) facts.push({ kind: 'check' });
  return facts;
}

// A piece worth having left where the opponent can take it for less than it's
// worth - and not as a trade, taking as much as it gives.
export function isSacrifice(move: Move): boolean {
  if (move.piece === 'p' || move.piece === 'k') return false;
  const given = PIECE_VALUE[move.promotion ?? move.piece];
  const taken = move.captured ? PIECE_VALUE[move.captured] : 0;
  if (taken >= given) return false;
  return isLoose(new Chess(move.after), move.to);
}
