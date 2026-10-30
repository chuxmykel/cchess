import { useCallback, useMemo, useState } from 'react';
import {
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Circle,
  LinearGradient,
  Line as SkiaLine,
  matchFont,
  vec,
} from '@shopify/react-native-skia';
import { useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  Area,
  CartesianChart,
  ChartBounds,
  Line,
  useChartPressState,
} from 'victory-native';
import { format } from 'date-fns';

import { ACCENT_COLOR, MUTED_COLOR } from '../../constants/colors';
import { RatingPoint } from '../../network/restClient';
import { nearestDatumIndex, ratingChartData } from '../../utils/ratingChart';

interface RatingChartProps {
  history: RatingPoint[];
  /** The start and end of the period shown. */
  from: Date;
  to: Date;
  testID?: string;
}

const CHART_HEIGHT = 180;
// The picked point is a lighter shade of the line's green, ringed in white
// to stand off it; a quiet grey guide marks its time down the whole chart.
const SELECTION_COLOR = '#A8C98A';
const GUIDE_COLOR = '#C4C4C4';
const MINUTE_MS = 60 * 1000;
// victory-native rounds the rating axis to "nice" values and picks about
// this many ticks across it.
const Y_TICK_COUNT = 3;
const AXIS_FONT = matchFont({
  fontFamily: Platform.select({ ios: 'Helvetica', default: 'sans-serif' }),
  fontSize: 11,
});

function dateLabel(time: number, from: Date, to: Date): string {
  const spansYears = from.getFullYear() !== to.getFullYear();
  return format(time, spansYears ? 'MMM d, yyyy' : 'MMM d');
}

/** The rating over time, as a line across the period. Tapping it shows
 * the rating at the nearest point, and holding and sliding along it scrubs
 * through them; the point picked stays shown until another is. */
const RatingChart: React.FC<RatingChartProps> = ({
  history,
  from,
  to,
  testID,
}) => {
  // victory-native resets its press state whenever `data` changes, so the
  // data is only rebuilt when what it plots does - to the minute, since
  // the period's end is "now" and moves on every render.
  const fromMs = Math.floor(from.getTime() / MINUTE_MS) * MINUTE_MS;
  const toMs = Math.floor(to.getTime() / MINUTE_MS) * MINUTE_MS;
  const data = useMemo(
    () => ratingChartData(history, fromMs, toMs),
    [history, fromMs, toMs],
  );
  const { state: pressState } = useChartPressState({
    x: 0,
    y: { rating: 0 },
  });
  const [chartBounds, setChartBounds] = useState<ChartBounds | null>(null);
  // The point picked, for the data it was picked from - a new period or
  // category clears it.
  const [selection, setSelection] = useState<{
    data: typeof data;
    index: number;
  } | null>(null);
  const selectedIndex = selection?.data === data ? selection.index : null;
  const selected = selectedIndex === null ? undefined : data[selectedIndex];

  const select = useCallback(
    (index: number) => setSelection({ data, index }),
    [data],
  );
  // No dependency list: Reanimated restarts the reaction itself when what
  // its worklets capture (select, with the data) changes, and warns that a
  // list is ignored on native.
  useAnimatedReaction(
    () => (pressState.isActive.value ? pressState.matchedIndex.value : -1),
    (index, previous) => {
      if (index >= 0 && index !== previous) scheduleOnRN(select, index);
    },
  );

  // Touching the chart picks the nearest point at once, here - before
  // victory-native's own press, which takes over when the finger moves.
  function selectAt(event: GestureResponderEvent) {
    if (!chartBounds || data.length === 0) return;
    const { left, right } = chartBounds;
    const share = (event.nativeEvent.locationX - left) / (right - left);
    select(nearestDatumIndex(data, fromMs + share * (toMs - fromMs)));
  }

  return (
    <View testID={testID}>
      <Text style={styles.pressed} testID="rating-chart-pressed">
        {selected
          ? `${selected.rating} · ${selected.isHeld ? 'Now' : format(selected.time, 'MMM d, yyyy')}`
          : ' '}
      </Text>
      <Pressable
        style={styles.chart}
        onPressIn={selectAt}
        accessibilityHint="Shows the rating at a point"
        testID="rating-chart-touch"
      >
        <CartesianChart
          data={data}
          xKey="time"
          yKeys={['rating']}
          domain={{ x: [fromMs, toMs] }}
          domainPadding={{ top: 6, bottom: 6 }}
          chartPressState={pressState}
          // Scrub as soon as the finger moves sideways, rather than after
          // victory-native's default 100ms hold; moving mostly up or down
          // lets the page scroll instead.
          chartPressConfig={{
            pan: { activeOffsetX: [-4, 4], failOffsetY: [-8, 8] },
          }}
          onChartBoundsChange={setChartBounds}
          xAxis={{
            font: AXIS_FONT,
            tickValues: [fromMs, toMs],
            formatXLabel: (time) => dateLabel(time, from, to),
            labelColor: MUTED_COLOR,
            lineWidth: 0,
          }}
          yAxis={[
            {
              font: AXIS_FONT,
              axisSide: 'right',
              tickCount: Y_TICK_COUNT,
              labelColor: MUTED_COLOR,
              lineColor: '#e0e0e0',
            },
          ]}
        >
          {({ points, chartBounds: bounds }) => (
            <>
              <Area
                points={points.rating}
                y0={bounds.bottom}
                curveType="linear"
              >
                <LinearGradient
                  start={vec(0, bounds.top)}
                  end={vec(0, bounds.bottom)}
                  colors={[`${ACCENT_COLOR}55`, `${ACCENT_COLOR}00`]}
                />
              </Area>
              <Line
                points={points.rating}
                color={ACCENT_COLOR}
                strokeWidth={2}
                curveType="linear"
              />
              {selectedIndex !== null &&
                typeof points.rating[selectedIndex]?.y === 'number' && (
                  <>
                    <SkiaLine
                      p1={vec(points.rating[selectedIndex].x, bounds.top)}
                      p2={vec(points.rating[selectedIndex].x, bounds.bottom)}
                      color={GUIDE_COLOR}
                      strokeWidth={1}
                    />
                    <Circle
                      cx={points.rating[selectedIndex].x}
                      cy={points.rating[selectedIndex].y}
                      r={7}
                      color="white"
                    />
                    <Circle
                      cx={points.rating[selectedIndex].x}
                      cy={points.rating[selectedIndex].y}
                      r={5}
                      color={SELECTION_COLOR}
                    />
                  </>
                )}
            </>
          )}
        </CartesianChart>
      </Pressable>
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
