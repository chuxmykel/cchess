import { useCallback, useMemo, useState } from 'react';
import { Color, DEFAULT_POSITION, Square } from 'chess.js';

import {
  CastlingRights,
  EMPTY_SETUP,
  SetupPiece,
  SetupState,
  availableCastling,
  setupFromFen,
  setupToFen,
  validateSetup,
} from '../domain/positionSetup';

// What the board does: a tap puts this piece there, or clears it - or, with
// the hand, pieces are dragged from square to square, or off the board.
export type EditorTool = SetupPiece | 'erase' | 'move';

// Setting up a position by hand: a tool picked from the palette, then
// squares tapped. Tapping a square with the same piece already on it takes
// it off again.
export function usePositionEditor(initialFen: string = DEFAULT_POSITION) {
  const [setup, setSetup] = useState<SetupState>(() =>
    setupFromFen(initialFen),
  );
  const [tool, setTool] = useState<EditorTool>({ type: 'p', color: 'w' });

  const tapSquare = useCallback(
    (square: Square) => {
      setSetup((previous) => {
        const board = { ...previous.board };
        const there = board[square];
        if (tool === 'move') return previous;
        if (
          tool === 'erase' ||
          (there?.type === tool.type && there?.color === tool.color)
        ) {
          delete board[square];
        } else {
          board[square] = tool;
        }
        return { ...previous, board };
      });
    },
    [tool],
  );

  // A piece dragged to another square - taking the place of any there - or
  // off the board (`to` null).
  const movePiece = useCallback((from: Square, to: Square | null) => {
    setSetup((previous) => {
      const piece = previous.board[from];
      if (!piece || from === to) return previous;
      const board = { ...previous.board };
      delete board[from];
      if (to) board[to] = piece;
      return { ...previous, board };
    });
  }, []);

  const setTurn = useCallback(
    (turn: Color) => setSetup((previous) => ({ ...previous, turn })),
    [],
  );

  const toggleCastling = useCallback(
    (right: keyof CastlingRights) =>
      setSetup((previous) => ({
        ...previous,
        castling: { ...previous.castling, [right]: !previous.castling[right] },
      })),
    [],
  );

  const clear = useCallback(() => setSetup(EMPTY_SETUP), []);
  const startPosition = useCallback(
    () => setSetup(setupFromFen(DEFAULT_POSITION)),
    [],
  );

  const errors = useMemo(() => validateSetup(setup), [setup]);
  const available = useMemo(() => availableCastling(setup.board), [setup]);

  return {
    setup,
    tool,
    setTool,
    tapSquare,
    movePiece,
    setTurn,
    toggleCastling,
    clear,
    startPosition,
    errors,
    availableCastling: available,
    fen: setupToFen(setup),
  };
}

export type PositionEditor = ReturnType<typeof usePositionEditor>;
