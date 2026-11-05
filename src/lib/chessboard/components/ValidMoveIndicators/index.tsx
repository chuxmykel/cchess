import { Animated } from 'react-native';
import { SQUARES } from '../../constants';
import { getXYFromSquare } from '../../coordinates';
import { Color, Square } from '../../types';
import ValidMoveIndicator from './ValidMoveIndicator';

interface ValidMoveIndicatorsProps {
  pieceWidth: number;
  orientation: Color;
  opacities: Record<Square, Animated.Value>;
  color: string;
}

const ValidMoveIndicators: React.FC<ValidMoveIndicatorsProps> = ({
  pieceWidth,
  orientation,
  opacities,
  color,
}) => (
  <>
    {SQUARES.map((square) => (
      <ValidMoveIndicator
        key={square}
        testID={`valid-move-${square}`}
        position={getXYFromSquare(square, pieceWidth, orientation)}
        squareWidth={pieceWidth}
        opacity={opacities[square]}
        color={color}
      />
    ))}
  </>
);

export default ValidMoveIndicators;
