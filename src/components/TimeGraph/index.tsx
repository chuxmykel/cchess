import { useState } from 'react';
import { GestureResponderEvent, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { Color } from 'chess.js';

import { makeStyles, useTheme } from '../../theme';

interface TimeGraphProps {
  // How long each move took, in ms.
  times: number[];
  // Each move's side.
  colors: Color[];
  // The side reviewed, whose bars are drawn in the accent.
  side: Color;
  // The move shown - -1 for the start - marked by a line down the graph.
  index: number;
  // The moves the clock calls out: the longest think, a hasty slip.
  slow?: number | null;
  hasty?: number | null;
  onSelect: (index: number) => void;
  height?: number;
}

// Where the time went: a bar for each move, as long as it took, under the
// eval graph and lined up with it - the side reviewed's in the accent, the
// other's faint, the longest think and a slip played in a hurry called out.
const TimeGraph: React.FC<TimeGraphProps> = ({
  times,
  colors: movers,
  side,
  index,
  slow = null,
  hasty = null,
  onSelect,
  height = 44,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const count = Math.max(1, times.length);
  const slot = width / count;
  const longest = Math.max(1, ...times);

  const pick = (event: GestureResponderEvent) => {
    if (width === 0) return;
    const at = Math.floor((event.nativeEvent.locationX / width) * count);
    onSelect(Math.max(0, Math.min(times.length - 1, at)));
  };

  const fillOf = (i: number) => {
    if (i === hasty) return colors.moveClass.blunder;
    if (i === slow) return colors.moveClass.inaccuracy;
    return movers[i] === side ? colors.accent : colors.textFaint;
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
      accessibilityLabel="Time spent on each move"
      testID="time-graph"
    >
      {width > 0 && (
        <Svg width={width} height={height}>
          {times.map((ms, i) => {
            const barHeight = Math.max(1.5, (ms / longest) * (height - 4));
            return (
              <Rect
                key={i}
                x={i * slot + slot * 0.15}
                y={height - barHeight}
                width={Math.max(1, slot * 0.7)}
                height={barHeight}
                rx={1}
                fill={fillOf(i)}
                testID={`time-graph-bar-${i}`}
              />
            );
          })}
          {index >= 0 && (
            <Line
              x1={(index + 0.5) * slot}
              x2={(index + 0.5) * slot}
              y1={0}
              y2={height}
              stroke={colors.accent}
              strokeWidth={2}
              testID="time-graph-cursor"
            />
          )}
        </Svg>
      )}
    </View>
  );
};

export default TimeGraph;

const useStyles = makeStyles((t) => ({
  graph: {
    width: '100%',
    borderRadius: t.radius.md,
    overflow: 'hidden',
    backgroundColor: t.colors.surface,
  },
}));
