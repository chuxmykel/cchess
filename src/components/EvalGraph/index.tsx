import { useState } from 'react';
import { GestureResponderEvent, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import type { EngineScore } from '../../domain/evalScore';
import type { MoveClass, ReviewedMove } from '../../domain/review/types';
import { whiteWinningChances } from '../../domain/review/winChances';
import { makeStyles, useTheme } from '../../theme';

interface EvalGraphProps {
  // Every position's score, the start first.
  scores: EngineScore[];
  moves: ReviewedMove[];
  // The move shown - -1 for the start - marked by a line down the graph.
  index: number;
  // A tap, or a finger sliding along it, picks the move there.
  onSelect: (index: number) => void;
  height?: number;
}

// The moves marked on the line: the standouts and the slips.
const MARKED: MoveClass[] = [
  'brilliant',
  'great',
  'inaccuracy',
  'mistake',
  'miss',
  'blunder',
];

// How the game went: white's winning chances at each position, the white
// area rising from the bottom against black's - lichess's curve, so a pawn
// shows and a rook doesn't fill it. Notable moves are dots on the line.
const EvalGraph: React.FC<EvalGraphProps> = ({
  scores,
  moves,
  index,
  onSelect,
  height = 72,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const steps = Math.max(1, scores.length - 1);
  const xAt = (position: number) => (position / steps) * width;
  // Kept a little off the top and bottom, so a won game's line still shows.
  const yAt = (score: EngineScore) =>
    height / 2 - whiteWinningChances(score) * (height / 2 - 2);

  const line = scores
    .map((score, i) => `${i === 0 ? 'M' : 'L'}${xAt(i)},${yAt(score)}`)
    .join(' ');
  const area = `${line} L${xAt(scores.length - 1)},${height} L0,${height} Z`;

  const pick = (event: GestureResponderEvent) => {
    if (width === 0) return;
    const position = Math.round((event.nativeEvent.locationX / width) * steps);
    onSelect(Math.max(-1, Math.min(moves.length - 1, position - 1)));
  };

  return (
    <View
      style={[styles.graph, { height }]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={pick}
      onResponderMove={pick}
      accessibilityRole="adjustable"
      accessibilityLabel="Evaluation graph"
      testID="eval-graph"
    >
      {width > 0 && (
        <Svg width={width} height={height}>
          <Rect width={width} height={height} fill={colors.evalBar.black} />
          <Path d={area} fill={colors.evalBar.white} testID="eval-graph-area" />
          <Line
            x1={0}
            x2={width}
            y1={height / 2}
            y2={height / 2}
            stroke={colors.chart.guide}
            strokeWidth={0.5}
          />
          <Line
            x1={xAt(index + 1)}
            x2={xAt(index + 1)}
            y1={0}
            y2={height}
            stroke={colors.accent}
            strokeWidth={2}
            testID="eval-graph-cursor"
          />
          {moves.map((move, i) =>
            MARKED.includes(move.moveClass) ? (
              <Circle
                key={move.ply}
                cx={xAt(i + 1)}
                cy={yAt(scores[i + 1])}
                r={3.5}
                fill={colors.moveClass[move.moveClass]}
                testID={`eval-graph-dot-${i}`}
              />
            ) : null,
          )}
        </Svg>
      )}
    </View>
  );
};

export default EvalGraph;

const useStyles = makeStyles((t) => ({
  graph: {
    width: '100%',
    borderRadius: t.radius.md,
    overflow: 'hidden',
    backgroundColor: t.colors.evalBar.black,
  },
}));
