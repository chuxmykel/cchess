import { Text, View } from 'react-native';

import Button from '../Button';
import Icon from '../Icon';
import { makeStyles, useTheme } from '../../theme';

interface ConditionalMovePanelProps {
  /** The line, as it reads: "1... e5 2. Nf3". */
  line: string;
  isSaved: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  onSave: () => void;
}

// Under a daily game's analysis board, while the line looked at runs on from
// the game's position: saving it as conditional moves has the replies in it
// played the moment the opponent makes the moves they answer.
const ConditionalMovePanel: React.FC<ConditionalMovePanelProps> = ({
  line,
  isSaved,
  isSaving,
  errorMessage,
  onSave,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.panel} testID="conditional-move-panel">
      <View style={styles.text}>
        <Text style={styles.title}>Conditional moves</Text>
        <Text style={styles.line} numberOfLines={2}>
          {line}
        </Text>
        {errorMessage && (
          <Text style={styles.error} testID="conditional-move-error">
            {errorMessage}
          </Text>
        )}
      </View>
      {isSaved ? (
        <View style={styles.saved} testID="conditional-move-saved">
          <Icon name="check" size={18} color={colors.accent} />
          <Text style={styles.savedText}>Saved</Text>
        </View>
      ) : (
        <Button
          label="Save"
          onPress={onSave}
          disabled={isSaving}
          variant="outline"
          testID="save-conditional-moves-button"
        />
      )}
    </View>
  );
};

export default ConditionalMovePanel;

const useStyles = makeStyles((t) => ({
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    marginHorizontal: t.spacing.lg,
    marginTop: t.spacing.sm,
    padding: t.spacing.md,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
  },
  text: {
    flex: 1,
    gap: t.spacing.xxs,
  },
  title: {
    color: t.colors.textMuted,
    fontSize: t.fontSize.xs,
    fontWeight: t.fontWeight.semibold,
    textTransform: 'uppercase',
  },
  line: {
    color: t.colors.text,
    fontSize: t.fontSize.base,
    fontWeight: t.fontWeight.medium,
  },
  error: {
    color: t.colors.danger,
    fontSize: t.fontSize.sm,
  },
  saved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
  },
  savedText: {
    color: t.colors.accentText,
    fontWeight: t.fontWeight.semibold,
  },
}));
