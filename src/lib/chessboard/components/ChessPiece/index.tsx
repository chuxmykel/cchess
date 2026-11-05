import { memo, useMemo } from 'react';
import { SvgXml } from 'react-native-svg';

import { defaultPieceSet } from '../../defaultPieceSet';
import { PieceCode, PieceSet } from '../../types';

export interface ChessPieceProps {
  piece: PieceCode;
  size: number;
  // The set it's drawn from: the board's own, unless given another.
  pieceSet?: PieceSet;
  // Drawn in this one color, a silhouette, rather than in its own.
  color?: string;
  accessibilityLabel?: string;
  testID?: string;
}

// Every color the SVG names - fills and strokes, not `none` - made one.
export function silhouette(svg: string, color: string): string {
  return svg.replace(
    /(fill|stroke)="(?!none")[^"]*"/g,
    (_, attribute) => `${attribute}="${color}"`,
  );
}

// One piece on its own, off the board - a promotion's choices, the pieces
// taken - drawn from a set, as the board draws it.
const ChessPiece: React.FC<ChessPieceProps> = ({
  piece,
  size,
  pieceSet = defaultPieceSet,
  color,
  accessibilityLabel,
  testID,
}) => {
  const svg = pieceSet[piece];
  const xml = useMemo(
    () => (color ? silhouette(svg, color) : svg),
    [svg, color],
  );
  return (
    <SvgXml
      xml={xml}
      width={size}
      height={size}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    />
  );
};

export default memo(ChessPiece);
