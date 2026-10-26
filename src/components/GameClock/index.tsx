import { View, Text, StyleSheet } from 'react-native';

interface GameClockProps {
  ms: number;
  isActive: boolean;
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
  return (
    <View
      style={[styles.container, isActive && styles.active]}
      testID={`game-clock-${label}`}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.time, isLowTime(ms) && styles.timeLow]}>
        {formatClock(ms)}
      </Text>
    </View>
  );
};

export default GameClock;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    minWidth: 140,
  },
  active: {
    backgroundColor: '#e3edd8',
  },
  label: {
    fontSize: 14,
    color: '#555',
  },
  time: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timeLow: {
    color: '#e53935',
  },
});
