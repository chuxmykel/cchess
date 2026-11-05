import { useMemo } from 'react';
import { Color } from 'chess.js';

import { Chessboard } from '../../lib/chessboard';
import { PositionEditor } from '../../hooks/usePositionEditor';
import { useChessboardColors } from './boardStyle';
import { usePieceSet } from './pieceSets';

interface SetupBoardProps {
  editor: PositionEditor;
  width: number;
  // The side at the bottom.
  orientation?: Color;
}

const NO_ANIMATION = { enabled: false };

// The board a position is set up on: tapped with the editor's tool - a piece
// put down, or the eraser - or, with the hand, its pieces dragged anywhere,
// off the board to take them away.
const SetupBoard: React.FC<SetupBoardProps> = ({
  editor,
  width,
  orientation = 'w',
}) => {
  const colors = useChessboardColors();
  const pieceSet = usePieceSet();
  const isHand = editor.tool === 'move';
  const movable = useMemo(
    () => (isHand ? { color: 'both' as const, free: true } : null),
    [isHand],
  );
  const { movePiece, tapSquare } = editor;

  return (
    <Chessboard
      fen={editor.fen}
      size={width}
      orientation={orientation}
      colors={colors}
      pieceSet={pieceSet}
      movable={movable}
      onMove={movePiece}
      onDropOff={(square) => movePiece(square, null)}
      onSquarePress={tapSquare}
      animation={NO_ANIMATION}
      testID="editor-board"
    />
  );
};

export default SetupBoard;
