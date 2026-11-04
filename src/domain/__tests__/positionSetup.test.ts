import { DEFAULT_POSITION } from 'chess.js';

import {
  EMPTY_SETUP,
  SetupState,
  availableCastling,
  setupFromFen,
  setupToFen,
  validateSetup,
} from '../positionSetup';

const KINGS: SetupState = {
  ...EMPTY_SETUP,
  board: { e1: { type: 'k', color: 'w' }, e8: { type: 'k', color: 'b' } },
};

describe('positionSetup', () => {
  it('reads a FEN and writes it back', () => {
    expect(setupToFen(setupFromFen(DEFAULT_POSITION))).toBe(DEFAULT_POSITION);
  });

  it('writes a bare position with no castling', () => {
    expect(setupToFen(KINGS)).toBe('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
    expect(setupToFen({ ...KINGS, turn: 'b' })).toBe(
      '4k3/8/8/8/8/8/8/4K3 b - - 0 1',
    );
  });

  it('allows castling only with king and rook on their squares', () => {
    const board = {
      ...KINGS.board,
      h1: { type: 'r', color: 'w' },
      a8: { type: 'r', color: 'b' },
    } as const;

    expect(availableCastling(board)).toEqual({
      K: true,
      Q: false,
      k: false,
      q: true,
    });
    expect(
      setupToFen({
        board,
        turn: 'w',
        castling: { K: true, Q: true, k: true, q: true },
      }).split(' ')[2],
    ).toBe('Kq');
  });

  it('accepts a legal position', () => {
    expect(validateSetup(KINGS)).toEqual([]);
    expect(validateSetup(setupFromFen(DEFAULT_POSITION))).toEqual([]);
  });

  it.each([
    ['no white king', { e8: { type: 'k', color: 'b' } }, 'white-king'],
    [
      'two black kings',
      { ...KINGS.board, d8: { type: 'k', color: 'b' } },
      'black-king',
    ],
    [
      'a pawn on the back rank',
      { ...KINGS.board, a8: { type: 'p', color: 'w' } },
      'pawn-on-back-rank',
    ],
    [
      'the side not to move in check',
      { ...KINGS.board, e2: { type: 'q', color: 'w' } },
      'opponent-in-check',
    ],
  ] as const)('refuses %s', (_, board, error) => {
    // White to move with black's king attacked: black must have just
    // left it in check.
    expect(validateSetup({ ...EMPTY_SETUP, board })).toContain(error);
  });

  it('refuses more than 16 pieces a side', () => {
    const board: SetupState['board'] = { ...KINGS.board };
    for (const file of 'abcdefgh') {
      board[`${file}2` as 'a2'] = { type: 'p', color: 'w' };
      board[`${file}3` as 'a3'] = { type: 'n', color: 'w' };
    }

    expect(validateSetup({ ...EMPTY_SETUP, board })).toContain(
      'too-many-pieces',
    );
  });
});
