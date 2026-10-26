import { Color, Square } from 'chess.js';

import { Position } from '../../../domain/types';
import { getXYFromSquare } from '../../../domain/boardCoordinates';
import { AnimatedPieceView } from '../../../hooks/usePieceAnimations';
import Piece from './Piece';

interface PiecesProps {
  pieces: AnimatedPieceView[];
  pieceWidth: number;
  orientation: Color;
  isOwnPieceAt: (square: Square) => boolean;
  locked: boolean;
  onTap: (square: Square) => void;
  onDragStart: (square: Square) => void;
  onDragRelease: (from: Square, to: Square) => void;
  onDrag: (position: Position) => void;
  showDragGuide: () => void;
  hideDragGuide: () => void;
}

const Pieces: React.FC<PiecesProps> = ({
  pieces,
  pieceWidth,
  orientation,
  isOwnPieceAt,
  locked,
  onTap,
  onDragStart,
  onDragRelease,
  onDrag,
  showDragGuide,
  hideDragGuide,
}) => (
  <>
    {pieces.map((piece) => (
      <Piece
        key={piece.id}
        id={piece.spriteId}
        width={pieceWidth}
        position={getXYFromSquare(piece.square, pieceWidth, orientation)}
        orientation={orientation}
        animatedPosition={piece.animatedPosition}
        disabled={!isOwnPieceAt(piece.square) || locked}
        opacity={piece.opacity}
        onTap={onTap}
        onDragStart={onDragStart}
        onDragRelease={onDragRelease}
        onDrag={onDrag}
        showDragGuide={showDragGuide}
        hideDragGuide={hideDragGuide}
      />
    ))}
  </>
);

export default Pieces;
