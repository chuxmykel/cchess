import { View, Text } from 'react-native';
import { makeStyles } from '../../theme';

interface GameClockProps {
  ms: number;
  isActive: boolean;
  /** Whose clock it is - read out by screen readers, not shown. */
  label: string;
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

const GameClock: React.FC<GameClockProps> = ({ ms, isActive, label }) => {
  const styles = useStyles();

  return (
    <View
      style={[styles.container, isActive && styles.active]}
      accessible
      accessibilityLabel={`${label} clock, ${formatClock(ms)}`}
      testID={`game-clock-${label}`}
    >
      <Text style={[styles.time, isLowTime(ms) && styles.timeLow]}>
        {formatClock(ms)}
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
  timeLow: {
    color: t.colors.danger,
  },
}));
