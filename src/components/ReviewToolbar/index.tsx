import { View } from 'react-native';

import Button from '../Button';
import { ToolbarButton } from '../GameToolbar';
import { makeStyles } from '../../theme';

interface ReviewToolbarProps {
  // Try for a better move - offered at a slip.
  onRetry?: () => void;
  showingLine: boolean;
  onToggleLine: () => void;
  showingBest: boolean;
  onToggleBest: () => void;
  canShowBest: boolean;
  // The big button: Next, Resume after stepping away, or a new start.
  primaryLabel: string;
  onPrimary: () => void;
}

// Under a review's board: Retry, Show (the engine's line) and Best, and
// Next - on to the next key moment.
const ReviewToolbar: React.FC<ReviewToolbarProps> = ({
  onRetry,
  showingLine,
  onToggleLine,
  showingBest,
  onToggleBest,
  canShowBest,
  primaryLabel,
  onPrimary,
}) => {
  const styles = useStyles();
  return (
    <View style={styles.toolbar} testID="review-toolbar">
      <ToolbarButton
        icon="restore"
        label="Retry"
        caption="Retry"
        hint="Try to find a better move"
        onPress={onRetry ?? (() => {})}
        disabled={!onRetry}
        testID="review-retry"
      />
      <ToolbarButton
        icon={showingLine ? 'eye-off-outline' : 'eye-outline'}
        label={showingLine ? 'Hide' : 'Show'}
        caption={showingLine ? 'Hide' : 'Show'}
        hint="The engine's line from here"
        onPress={onToggleLine}
        testID="review-show"
      />
      <ToolbarButton
        icon={showingBest ? 'star' : 'star-outline'}
        label="Best"
        caption="Best"
        hint="Play the best move here"
        onPress={onToggleBest}
        disabled={!canShowBest}
        testID="review-best"
      />
      <Button
        label={primaryLabel}
        onPress={onPrimary}
        style={styles.primary}
        testID="review-next"
      />
    </View>
  );
};

export default ReviewToolbar;

const useStyles = makeStyles((t) => ({
  toolbar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.sm,
  },
  primary: {
    flex: 1,
  },
}));
