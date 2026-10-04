import { Animated } from "react-native";
import { Square } from "chess.js";

import { SQUARES } from "../../../../constants";
import { getXYFromSquare } from "../../../../domain/boardCoordinates";
import ValidMoveIndicator from "../ValidMoveIndicator";

interface ValidMoveIndicatorsProps {
  pieceWidth: number;
  opacities: Record<Square, Animated.Value>;
}

const ValidMoveIndicators: React.FC<ValidMoveIndicatorsProps> = ({
  pieceWidth,
  opacities,
}) => (
  <>
    {SQUARES.map((square) => (
      <ValidMoveIndicator
        key={square}
        testID={`valid-move-${square}`}
        position={getXYFromSquare(square, pieceWidth)}
        squareWidth={pieceWidth}
        opacity={opacities[square]}
      />
    ))}
  </>
);

export default ValidMoveIndicators;
