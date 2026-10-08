import { Square } from 'chess.js';

import { NUMBER_OF_ROWS } from '../../../constants';
import Row from '../Row';

interface BoardSurfaceProps {
  colors: {
    light: string;
    dark: string;
  };
  onSquarePress: (square: Square) => void;
}

const BoardSurface: React.FC<BoardSurfaceProps> = ({
  colors,
  onSquarePress,
}) => (
  <>
    {new Array(NUMBER_OF_ROWS).fill('').map((_, idx) => (
      <Row
        key={idx}
        colors={colors}
        rank={NUMBER_OF_ROWS - idx}
        onSquarePress={onSquarePress}
      />
    ))}
  </>
);

export default BoardSurface;
