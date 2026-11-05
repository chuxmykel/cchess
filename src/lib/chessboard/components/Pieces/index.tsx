import { SharedValue } from 'react-native-reanimated';

import { DragGuide } from '../../hooks/useDragGuide';
import { MovableSquares } from '../../hooks/usePieceGesture';
import { TrackedPiece } from '../../hooks/usePieceTracker';
import { Color, Dests, KingCheck, PieceImages, Square } from '../../types';
import Piece from './Piece';
import StaticPiece from './StaticPiece';

interface PiecesProps {
  pieces: TrackedPiece[];
  pieceWidth: number;
  orientation: Color;
  pieceImages: PieceImages;
  // The king in danger, if any, glowing red - and fallen, once beaten.
  kingInDanger: KingCheck | null;
  dangerColor: string;
  // Drawn only: no gestures at all.
  viewOnly?: boolean;
  // The squares whose pieces can be picked up now.
  movable: SharedValue<MovableSquares>;
  dests: SharedValue<Dests>;
  free?: boolean;
  dragGuide: DragGuide;
  onTap: (square: Square) => void;
  onDragStart: (square: Square) => void;
  onDragRelease: (from: Square, to: Square | null, isMove: boolean) => void;
  onDragLog?: (line: string) => void;
}

const Pieces: React.FC<PiecesProps> = ({
  pieces,
  pieceWidth,
  orientation,
  pieceImages,
  kingInDanger,
  dangerColor,
  viewOnly = false,
  movable,
  dests,
  free = false,
  dragGuide,
  onTap,
  onDragStart,
  onDragRelease,
  onDragLog,
}) => (
  <>
    {pieces.map((piece) => {
      const inDanger = !piece.captured && piece.square === kingInDanger?.square;
      if (viewOnly) {
        return (
          <StaticPiece
            key={piece.id}
            square={piece.square}
            x={piece.x}
            y={piece.y}
            captured={piece.captured ?? false}
            source={pieceImages[piece.spriteId]}
            width={pieceWidth}
            orientation={orientation}
            danger={inDanger ? kingInDanger : null}
            dangerColor={dangerColor}
          />
        );
      }
      return (
        <Piece
          key={piece.id}
          id={piece.spriteId}
          source={pieceImages[piece.spriteId]}
          square={piece.square}
          width={pieceWidth}
          orientation={orientation}
          x={piece.x}
          y={piece.y}
          disabled={piece.captured ?? false}
          movable={movable}
          captured={piece.captured ?? false}
          inDanger={inDanger}
          dangerColor={dangerColor}
          fallen={inDanger && kingInDanger.fallen}
          dests={dests}
          free={free}
          dragGuide={dragGuide}
          onTap={onTap}
          onDragStart={onDragStart}
          onDragRelease={onDragRelease}
          onDragLog={onDragLog}
        />
      );
    })}
  </>
);

export default Pieces;
