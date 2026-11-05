import { useMemo } from 'react';

import type { BoardColors } from '../../lib/chessboard';
import { useBoardColors, useTheme } from '../../theme';

// The board's colors from the app's theme: the squares from the board theme
// chosen in Appearance, everything drawn on them from the light or dark
// theme. The same object until either changes, so the board isn't
// re-rendered for nothing.
export function useChessboardColors(): BoardColors {
  const squares = useBoardColors();
  const { board } = useTheme().colors;
  return useMemo(
    () => ({
      light: squares.light,
      dark: squares.dark,
      lastMove: board.lastMove,
      moveHint: board.moveHint,
      dragOrigin: board.dragOrigin,
      check: board.check,
    }),
    [squares, board],
  );
}
