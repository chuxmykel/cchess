import { Chess, Color, PieceSymbol, Square, validateFen } from 'chess.js';

// A position being set up by hand: what stands where, whose move it is, and
// which castling the player has allowed.
export type SetupPiece = { type: PieceSymbol; color: Color };
export type CastlingRights = { K: boolean; Q: boolean; k: boolean; q: boolean };
export type SetupState = {
  board: Partial<Record<Square, SetupPiece>>;
  turn: Color;
  castling: CastlingRights;
};

export type SetupError =
  | 'white-king'
  | 'black-king'
  | 'pawn-on-back-rank'
  | 'too-many-pieces'
  | 'opponent-in-check';

export const EMPTY_SETUP: SetupState = {
  board: {},
  turn: 'w',
  castling: { K: false, Q: false, k: false, q: false },
};

export function setupFromFen(fen: string): SetupState {
  const chess = new Chess(fen);
  const board: SetupState['board'] = {};
  chess.board().forEach((row) =>
    row.forEach((piece) => {
      if (piece) board[piece.square] = { type: piece.type, color: piece.color };
    }),
  );
  const rights = fen.split(' ')[2];
  return {
    board,
    turn: chess.turn(),
    castling: {
      K: rights.includes('K'),
      Q: rights.includes('Q'),
      k: rights.includes('k'),
      q: rights.includes('q'),
    },
  };
}

const CASTLING_HOMES: Record<
  keyof CastlingRights,
  { king: Square; rook: Square; color: Color }
> = {
  K: { king: 'e1', rook: 'h1', color: 'w' },
  Q: { king: 'e1', rook: 'a1', color: 'w' },
  k: { king: 'e8', rook: 'h8', color: 'b' },
  q: { king: 'e8', rook: 'a8', color: 'b' },
};

// Which castling the pieces allow at all: the king and that rook both still
// on their starting squares.
export function availableCastling(board: SetupState['board']): CastlingRights {
  const on = (square: Square, type: PieceSymbol, color: Color) =>
    board[square]?.type === type && board[square]?.color === color;
  const can = (right: keyof CastlingRights) => {
    const { king, rook, color } = CASTLING_HOMES[right];
    return on(king, 'k', color) && on(rook, 'r', color);
  };
  return { K: can('K'), Q: can('Q'), k: can('k'), q: can('q') };
}

// The position as a FEN, keeping only castling the pieces still allow.
export function setupToFen({ board, turn, castling }: SetupState): string {
  const rows: string[] = [];
  for (let rank = 8; rank >= 1; rank--) {
    let row = '';
    let empty = 0;
    for (const file of 'abcdefgh') {
      const piece = board[`${file}${rank}` as Square];
      if (!piece) {
        empty++;
        continue;
      }
      if (empty) row += empty;
      empty = 0;
      row += piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
    }
    rows.push(empty ? row + empty : row);
  }
  const available = availableCastling(board);
  const rights = (['K', 'Q', 'k', 'q'] as const)
    .filter((right) => castling[right] && available[right])
    .join('');
  return `${rows.join('/')} ${turn} ${rights || '-'} - 0 1`;
}

// What stops a position from being analysed. Empty when it can be.
export function validateSetup(state: SetupState): SetupError[] {
  const pieces = Object.entries(state.board) as [Square, SetupPiece][];
  const count = (color: Color, type?: PieceSymbol) =>
    pieces.filter(([, p]) => p.color === color && (!type || p.type === type))
      .length;
  const errors: SetupError[] = [];
  if (count('w', 'k') !== 1) errors.push('white-king');
  if (count('b', 'k') !== 1) errors.push('black-king');
  if (
    pieces.some(
      ([square, p]) =>
        p.type === 'p' && (square[1] === '1' || square[1] === '8'),
    )
  ) {
    errors.push('pawn-on-back-rank');
  }
  if (count('w') > 16 || count('b') > 16) errors.push('too-many-pieces');
  if (errors.length) return errors;

  // The side that just moved can't have left its king in check.
  const fen = setupToFen(state);
  const flipped = fen.replace(/ [wb] /, ` ${state.turn === 'w' ? 'b' : 'w'} `);
  if (!validateFen(fen).ok || new Chess(flipped).isCheck()) {
    errors.push('opponent-in-check');
  }
  return errors;
}
