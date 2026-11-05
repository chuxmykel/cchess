import { Fragment, memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Line, Polygon } from 'react-native-svg';

import { getXYFromSquare } from '../../coordinates';
import { BoardArrow, Color, Square } from '../../types';

interface BoardArrowsProps {
  arrows: BoardArrow[];
  boardWidth: number;
  orientation?: Color;
}

// The head is this many times the shaft's thickness long, and its base this
// much of its length either side.
const HEAD_LENGTH = 2.4;
const HEAD_HALF_WIDTH = 0.55;
// The tip stops this far short of the square's centre, as on lichess.
const TIP_INSET = 0.1;

function arrowShape(arrow: BoardArrow, square: number, orientation: Color) {
  const centre = (at: Square) => {
    const { x, y } = getXYFromSquare(at, square, orientation);
    return { x: x + square / 2, y: y + square / 2 };
  };
  const from = centre(arrow.from);
  const to = centre(arrow.to);
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  const ux = (to.x - from.x) / length;
  const uy = (to.y - from.y) / length;
  const stroke = square * arrow.weight;
  const head = stroke * HEAD_LENGTH;
  const tip = {
    x: to.x - ux * square * TIP_INSET,
    y: to.y - uy * square * TIP_INSET,
  };
  const base = { x: tip.x - ux * head, y: tip.y - uy * head };
  const side = {
    x: -uy * head * HEAD_HALF_WIDTH,
    y: ux * head * HEAD_HALF_WIDTH,
  };
  return {
    from,
    base,
    stroke,
    head: [
      tip,
      { x: base.x + side.x, y: base.y + side.y },
      { x: base.x - side.x, y: base.y - side.y },
    ]
      .map(({ x, y }) => `${x},${y}`)
      .join(' '),
  };
}

// Arrows over the board, square centre to square centre - the moves an
// engine suggests. Drawn over the pieces, and never in the way of a touch.
const BoardArrows: React.FC<BoardArrowsProps> = ({
  arrows,
  boardWidth,
  orientation = 'w',
}) => {
  if (arrows.length === 0) return null;
  const square = boardWidth / 8;
  return (
    <Svg
      width={boardWidth}
      height={boardWidth}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      testID="board-arrows"
    >
      {arrows.map((arrow, index) => {
        const shape = arrowShape(arrow, square, orientation);
        return (
          // By place as well: two arrows can be the same move - the best
          // move, and what the other side would answer it with.
          <Fragment key={`${index}-${arrow.from}${arrow.to}`}>
            <Line
              x1={shape.from.x}
              y1={shape.from.y}
              x2={shape.base.x}
              y2={shape.base.y}
              stroke={arrow.color}
              strokeWidth={shape.stroke}
              strokeLinecap="round"
              testID={`arrow-${arrow.from}${arrow.to}`}
            />
            <Polygon points={shape.head} fill={arrow.color} />
          </Fragment>
        );
      })}
    </Svg>
  );
};

// Its own layer, re-rendered for its arrows alone - not the pieces under it.
export default memo(BoardArrows);
