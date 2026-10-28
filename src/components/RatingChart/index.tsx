import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
  Circle,
  LinearGradient,
  matchFont,
  vec,
} from '@shopify/react-native-skia';
import { useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Area, CartesianChart, Line, useChartPressState } from 'victory-native';
import { format } from 'date-fns';

import { ACCENT_COLOR, MUTED_COLOR } from '../../constants/colors';
import { RatingPoint } from '../../network/restClient';
import { ratingChartData } from '../../utils/ratingChart';

interface RatingChartProps {
  history: RatingPoint[];
  /** The start and end of the period shown. */
  from: Date;
  to: Date;
  testID?: string;
}

const CHART_HEIGHT = 180;
const AXIS_FONT = matchFont({
  fontFamily: Platform.select({ ios: 'Helvetica', default: 'sans-serif' }),
  fontSize: 11,
});

function dateLabel(time: number, from: Date, to: Date): string {
  const spansYears = from.getFullYear() !== to.getFullYear();
  return format(time, spansYears ? 'MMM d, yyyy' : 'MMM d');
}

/** The rating over time, as a line across the period. Pressing it shows
 * the rating at that point. */
const RatingChart: React.FC<RatingChartProps> = ({
  history,
  from,
  to,
  testID,
}) => {
  const { data, yDomain, yTicks } = ratingChartData(
    history,
    from.getTime(),
    to.getTime(),
  );
  const { state: pressState, isActive } = useChartPressState({
    x: 0,
    y: { rating: 0 },
  });
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  useAnimatedReaction(
    () => (pressState.isActive.value ? pressState.matchedIndex.value : -1),
    (index, previous) => {
      if (index !== previous) {
        scheduleOnRN(setPressedIndex, index < 0 ? null : index);
      }
    },
  );
  const pressed =
    isActive && pressedIndex !== null ? data[pressedIndex] : undefined;

  return (
    <View testID={testID}>
      <Text style={styles.pressed} testID="rating-chart-pressed">
        {pressed
          ? `${pressed.rating} · ${pressed.isHeld ? 'Now' : format(pressed.time, 'MMM d, yyyy h:mm a')}`
          : ' '}
      </Text>
      <View style={styles.chart}>
        <CartesianChart
          data={data}
          xKey="time"
          yKeys={['rating']}
          domain={{ x: [from.getTime(), to.getTime()], y: yDomain }}
          domainPadding={{ top: 6, bottom: 6 }}
          chartPressState={pressState}
          xAxis={{
            font: AXIS_FONT,
            tickValues: [from.getTime(), to.getTime()],
            formatXLabel: (time) => dateLabel(time, from, to),
            labelColor: MUTED_COLOR,
            lineWidth: 0,
          }}
          yAxis={[
            {
              font: AXIS_FONT,
              axisSide: 'right',
              tickValues: yTicks,
              labelColor: MUTED_COLOR,
              lineColor: '#e0e0e0',
            },
          ]}
        >
          {({ points, chartBounds }) => (
            <>
              <Area
                points={points.rating}
                y0={chartBounds.bottom}
                curveType="linear"
              >
                <LinearGradient
                  start={vec(0, chartBounds.top)}
                  end={vec(0, chartBounds.bottom)}
                  colors={[`${ACCENT_COLOR}55`, `${ACCENT_COLOR}00`]}
                />
              </Area>
              <Line
                points={points.rating}
                color={ACCENT_COLOR}
                strokeWidth={2}
                curveType="linear"
              />
              {isActive && (
                <Circle
                  cx={pressState.x.position}
                  cy={pressState.y.rating.position}
                  r={5}
                  color={ACCENT_COLOR}
                />
              )}
            </>
          )}
        </CartesianChart>
      </View>
    </View>
  );
};

export default RatingChart;

const styles = StyleSheet.create({
  pressed: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTED_COLOR,
    marginBottom: 4,
  },
  chart: {
    height: CHART_HEIGHT,
  },
});
