import { Color, Square } from 'chess.js';

import { NUMBER_OF_ROWS } from '../../../constants';
import Row from '../Row';

interface BoardSurfaceProps {
  colors: {
    light: string;
    dark: string;
  };
  orientation?: Color;
  onSquarePress?: (square: Square) => void;
}

const BoardSurface: React.FC<BoardSurfaceProps> = ({
  colors,
  orientation = 'w',
  onSquarePress,
}) => (
  <>
    {new Array(NUMBER_OF_ROWS).fill('').map((_, idx) => (
      <Row
        key={idx}
        colors={colors}
        rank={orientation === 'b' ? idx + 1 : NUMBER_OF_ROWS - idx}
        orientation={orientation}
        onSquarePress={onSquarePress}
      />
    ))}
  </>
);

export default BoardSurface;
