import { Chess, Color, PieceSymbol, Square } from 'chess.js';

import { LegalTargets } from './types';

const FILES = 'abcdefgh';

type Step = [number, number];

const KNIGHT_STEPS: Step[] = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
];
const ROOK_STEPS: Step[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const BISHOP_STEPS: Step[] = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];
const KING_STEPS: Step[] = [...ROOK_STEPS, ...BISHOP_STEPS];

function squareAt(file: number, rank: number): Square | null {
  if (file < 0 || file > 7 || rank < 1 || rank > 8) return null;
  return `${FILES[file]}${rank}` as Square;
}

function steps(file: number, rank: number, by: Step[]): Square[] {
  return by
    .map(([df, dr]) => squareAt(file + df, rank + dr))
    .filter((square): square is Square => square !== null);
}

// Every square along each line to the board's edge, whatever stands on it:
// the piece in the way may be gone by the time the move's played.
function rays(file: number, rank: number, by: Step[]): Square[] {
  const squares: Square[] = [];
  for (const [df, dr] of by) {
    for (let i = 1; ; i++) {
      const square = squareAt(file + df * i, rank + dr * i);
      if (!square) break;
      squares.push(square);
    }
  }
  return squares;
}

function pawnTargets(color: Color, file: number, rank: number): Square[] {
  const forward = color === 'w' ? 1 : -1;
  const startRank = color === 'w' ? 2 : 7;
  const targets = [
    squareAt(file, rank + forward),
    rank === startRank ? squareAt(file, rank + 2 * forward) : null,
    // A capture either side, with or without a piece there now.
    squareAt(file - 1, rank + forward),
    squareAt(file + 1, rank + forward),
  ];
  return targets.filter((square): square is Square => square !== null);
}

function castlingTargets(color: Color, fen: string, square: Square): Square[] {
  const rights = fen.split(' ')[2] ?? '-';
  const [kingside, queenside] = color === 'w' ? ['K', 'Q'] : ['k', 'q'];
  const backRank = color === 'w' ? 1 : 8;
  if (square !== `e${backRank}`) return [];
  return [
    rights.includes(kingside) ? (`g${backRank}` as Square) : null,
    rights.includes(queenside) ? (`c${backRank}` as Square) : null,
  ].filter((target): target is Square => target !== null);
}

function targetsOf(
  type: PieceSymbol,
  color: Color,
  square: Square,
  fen: string,
): Square[] {
  const file = FILES.indexOf(square[0]);
  const rank = Number(square[1]);
  switch (type) {
    case 'p':
      return pawnTargets(color, file, rank);
    case 'n':
      return steps(file, rank, KNIGHT_STEPS);
    case 'b':
      return rays(file, rank, BISHOP_STEPS);
    case 'r':
      return rays(file, rank, ROOK_STEPS);
    case 'q':
      return rays(file, rank, KING_STEPS);
    case 'k':
      return [
        ...steps(file, rank, KING_STEPS),
        ...castlingTargets(color, fen, square),
      ];
  }
}

/** Where each of `color`'s pieces might go once the opponent has moved:
 * every square it could reach on an empty board - a pawn's captures
 * either side included, and castling while the FEN still allows it - as
 * lichess's board offers. Whether it's a move is only known once the
 * opponent's is in, when one that isn't is dropped. */
export function premoveTargets(fen: string, color: Color): LegalTargets {
  const targets: LegalTargets = {};
  for (const row of new Chess(fen).board()) {
    for (const piece of row) {
      if (!piece || piece.color !== color) continue;
      targets[piece.square] = targetsOf(piece.type, color, piece.square, fen);
    }
  }
  return targets;
}

/** Whether a pre-move takes a pawn to its last rank - which, decided before
 * the moment comes, makes a queen. */
export function isPromotionPremove(
  fen: string,
  from: Square,
  to: Square,
): boolean {
  const piece = new Chess(fen).get(from);
  if (!piece || piece.type !== 'p') return false;
  return to[1] === (piece.color === 'w' ? '8' : '1');
}
