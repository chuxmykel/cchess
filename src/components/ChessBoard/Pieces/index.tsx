import { SharedValue } from 'react-native-reanimated';
import { Color, Square } from 'chess.js';

import { AnimatedPieceView } from '../../../hooks/usePieceAnimations';
import { DragGuide } from '../../../hooks/useDragGuide';
import { LegalTargets } from '../../../domain/types';
import Piece from './Piece';

interface PiecesProps {
  pieces: AnimatedPieceView[];
  pieceWidth: number;
  orientation: Color;
  isOwnPieceAt: (square: Square) => boolean;
  locked: boolean;
  legalTargets: SharedValue<LegalTargets>;
  dragGuide: DragGuide;
  onTap: (square: Square) => void;
  onDragStart: (square: Square) => void;
  onDragRelease: (from: Square, to: Square) => void;
}

const Pieces: React.FC<PiecesProps> = ({
  pieces,
  pieceWidth,
  orientation,
  isOwnPieceAt,
  locked,
  legalTargets,
  dragGuide,
  onTap,
  onDragStart,
  onDragRelease,
}) => (
  <>
    {pieces.map((piece) => (
      <Piece
        key={piece.id}
        id={piece.spriteId}
        square={piece.square}
        width={pieceWidth}
        orientation={orientation}
        x={piece.x}
        y={piece.y}
        disabled={piece.captured || !isOwnPieceAt(piece.square) || locked}
        captured={piece.captured ?? false}
        legalTargets={legalTargets}
        dragGuide={dragGuide}
        onTap={onTap}
        onDragStart={onDragStart}
        onDragRelease={onDragRelease}
      />
    ))}
  </>
);

export default Pieces;
