import { View, Text } from 'react-native';
import { makeStyles } from '../../theme';
import { DAILY_LOW_TIME_MS, formatTimeLeft } from '../../utils/timeLeft';

interface GameClockProps {
  ms: number;
  isActive: boolean;
  /** Whose clock it is - read out by screen readers, not shown. */
  label: string;
  /** A daily game's clock: the days and hours left on the move. */
  daily?: boolean;
}

const LOW_TIME_THRESHOLD_MS = 10000;

function isLowTime(ms: number): boolean {
  return ms <= LOW_TIME_THRESHOLD_MS;
}

// Below the low-time threshold, shows tenths of a second (e.g. "0:09.8")
// instead of whole seconds, for the same reason whole-second mode ceils
// rather than floors: it should never visually read a smaller value than
// what's actually left.
function formatClock(ms: number): string {
  if (isLowTime(ms)) {
    const totalDeciseconds = Math.ceil(ms / 100);
    const minutes = Math.floor(totalDeciseconds / 600);
    const seconds = Math.floor(totalDeciseconds / 10) % 60;
    const tenths = totalDeciseconds % 10;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
  }
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const GameClock: React.FC<GameClockProps> = ({
  ms,
  isActive,
  label,
  daily = false,
}) => {
  const styles = useStyles();
  const time = daily ? formatTimeLeft(ms) : formatClock(ms);
  const isLow = daily ? ms < DAILY_LOW_TIME_MS : isLowTime(ms);

  return (
    <View
      style={[styles.container, isActive && styles.active]}
      accessible
      accessibilityLabel={`${label} clock, ${time}`}
      testID={`game-clock-${label}`}
    >
      <Text
        style={[
          styles.time,
          daily && styles.timeDaily,
          isLow && styles.timeLow,
        ]}
      >
        {time}
      </Text>
    </View>
  );
};

export default GameClock;

const useStyles = makeStyles((t) => ({
  container: {
    alignItems: 'center',
    paddingVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.lg,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
    minWidth: 84,
  },
  active: {
    backgroundColor: t.colors.accentSoft,
  },
  time: {
    color: t.colors.text,
    fontSize: t.fontSize.xxl,
    fontWeight: t.fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  // "1 day 23h" is longer than any live clock.
  timeDaily: {
    fontSize: t.fontSize.lg,
  },
  timeLow: {
    color: t.colors.danger,
  },
}));
