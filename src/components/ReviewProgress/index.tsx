import { Text, View } from 'react-native';

import Button from '../Button';
import { makeStyles } from '../../theme';

interface ReviewProgressProps {
  // 0 to 1.
  progress: number;
  // What's under way: the engine downloading, starting, or the game.
  label: string;
  // Something went wrong, and can be tried again.
  onRetry?: () => void;
}

// How far a game's analysis has got - a bar filling as each position's
// done.
const ReviewProgress: React.FC<ReviewProgressProps> = ({
  progress,
  label,
  onRetry,
}) => {
  const styles = useStyles();
  const percent = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  return (
    <View style={styles.container} testID="review-progress">
      <Text style={styles.label} testID="review-progress-label">
        {label}
      </Text>
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: percent }}
      >
        <View
          style={[styles.fill, { width: `${percent}%` }]}
          testID="review-progress-fill"
        />
        <Text style={styles.percent}>{percent}%</Text>
      </View>
      {onRetry && (
        <Button
          label="Try again"
          onPress={onRetry}
          variant="outline"
          testID="review-progress-retry"
        />
      )}
    </View>
  );
};

export default ReviewProgress;

const useStyles = makeStyles((t) => ({
  container: {
    width: '100%',
    gap: t.spacing.sm,
  },
  label: {
    fontSize: t.fontSize.md,
    color: t.colors.textMuted,
    textAlign: 'center',
  },
  track: {
    height: 36,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surfaceStrong,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: t.colors.accent,
  },
  percent: {
    textAlign: 'center',
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.bold,
    color: t.colors.text,
    fontVariant: ['tabular-nums'],
  },
}));
