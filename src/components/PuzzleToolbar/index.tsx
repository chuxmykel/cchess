import { View } from 'react-native';

import { ToolbarButton } from '../GameToolbar';
import type { PuzzleSteps } from '../../hooks/usePuzzleSolver';
import { makeStyles } from '../../theme';

interface PuzzleToolbarProps {
  onHint: () => void;
  canHint: boolean;
  onSolution: () => void;
  canShowSolution: boolean;
  // Back to the puzzle's start - offered once it's missed.
  onRetry: () => void;
  canRetry: boolean;
  steps: PuzzleSteps;
}

// A puzzle's own toolbar, in place of the tabs': Hint (the next move),
// Solution (the whole line), Retry, and ‹ › through the moves played.
const PuzzleToolbar: React.FC<PuzzleToolbarProps> = ({
  onHint,
  canHint,
  onSolution,
  canShowSolution,
  onRetry,
  canRetry,
  steps,
}) => {
  const styles = useStyles();
  return (
    <View style={styles.toolbar} testID="puzzle-toolbar">
      <ToolbarButton
        icon="lightbulb-on-outline"
        label="Hint"
        caption="Hint"
        hint="Show the next move - the puzzle counts as missed"
        onPress={onHint}
        disabled={!canHint}
        testID="puzzle-hint"
      />
      <ToolbarButton
        icon="eye-outline"
        label="Solution"
        caption="Solution"
        hint="Play out the whole solution"
        onPress={onSolution}
        disabled={!canShowSolution}
        testID="puzzle-solution"
      />
      <ToolbarButton
        icon="restart"
        label="Retry"
        caption="Retry"
        hint="Try the puzzle again from its start"
        onPress={onRetry}
        disabled={!canRetry}
        testID="puzzle-retry"
      />
      <ToolbarButton
        icon="chevron-left"
        label="Previous move"
        onPress={steps.back}
        disabled={!steps.canGoBack}
        repeatsWhileHeld
        testID="puzzle-back"
      />
      <ToolbarButton
        icon="chevron-right"
        label="Next move"
        onPress={steps.forward}
        disabled={!steps.canGoForward}
        repeatsWhileHeld
        testID="puzzle-forward"
      />
    </View>
  );
};

export default PuzzleToolbar;

const useStyles = makeStyles((t) => ({
  toolbar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: t.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: t.colors.separator,
    backgroundColor: t.colors.background,
  },
}));
