import { memo } from 'react';
import { BOARD_SQUARES } from '../../constants';
import { Color, Square } from '../../types';
import Row from '../Row';

interface BoardSurfaceProps {
  colors: {
    light: string;
    dark: string;
  };
  orientation?: Color;
  coordinates?: boolean;
  onSquarePress?: (square: Square) => void;
}

const BoardSurface: React.FC<BoardSurfaceProps> = ({
  colors,
  orientation = 'w',
  coordinates = true,
  onSquarePress,
}) => (
  <>
    {new Array(BOARD_SQUARES).fill('').map((_, idx) => (
      <Row
        key={idx}
        colors={colors}
        rank={orientation === 'b' ? idx + 1 : BOARD_SQUARES - idx}
        orientation={orientation}
        coordinates={coordinates}
        onSquarePress={onSquarePress}
      />
    ))}
  </>
);

// Its 64 squares only change with the board's colours, its orientation or
// the tap handler - not on every move, which re-renders the board above it.
export default memo(BoardSurface);
