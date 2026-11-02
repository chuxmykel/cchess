import { SharedValue } from 'react-native-reanimated';
import { Color, Square } from 'chess.js';

import { AnimatedPieceView } from '../../../hooks/usePieceAnimations';
import { DragGuide } from '../../../hooks/useDragGuide';
import { KingInDanger, LegalTargets } from '../../../domain/types';
import Piece from './Piece';

interface PiecesProps {
  pieces: AnimatedPieceView[];
  pieceWidth: number;
  orientation: Color;
  isOwnPieceAt: (square: Square) => boolean;
  locked: boolean;
  // The king in danger, if any, glowing red - and fallen, once beaten.
  kingInDanger: KingInDanger | null;
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
  kingInDanger,
  legalTargets,
  dragGuide,
  onTap,
  onDragStart,
  onDragRelease,
}) => (
  <>
    {pieces.map((piece) => {
      const inDanger = !piece.captured && piece.square === kingInDanger?.square;
      return (
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
          inDanger={inDanger}
          fallen={inDanger && kingInDanger.fallen}
          legalTargets={legalTargets}
          dragGuide={dragGuide}
          onTap={onTap}
          onDragStart={onDragStart}
          onDragRelease={onDragRelease}
        />
      );
    })}
  </>
);

export default Pieces;
