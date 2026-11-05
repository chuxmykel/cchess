import { ActivityIndicator, Text, TextInput, View } from 'react-native';

import BottomSheet from '../BottomSheet';
import { GameNotesState } from '../../hooks/useGameNotes';
import { makeStyles, useTheme } from '../../theme';

const MAX_NOTES_LENGTH = 4000;

interface NotesSheetProps {
  visible: boolean;
  notes: GameNotesState;
  onClose: () => void;
}

// Your own notes on the game - plans, ideas, what to watch for - saved as
// you write, and seen by nobody else.
const NotesSheet: React.FC<NotesSheetProps> = ({ visible, notes, onClose }) => {
  const styles = useStyles();
  const { colors } = useTheme();

  function close() {
    notes.flush();
    onClose();
  }

  let status = 'Only you can see these.';
  if (notes.isSaving) status = 'Saving…';
  else if (notes.failed) status = "Couldn't save. Keep typing to try again.";

  return (
    <BottomSheet visible={visible} onClose={close} heightRatio={0.6}>
      <View style={styles.content} testID="notes-sheet">
        <Text style={styles.title}>Notes</Text>
        {notes.body === null ? (
          <ActivityIndicator color={colors.textMuted} />
        ) : (
          <TextInput
            style={styles.input}
            value={notes.body}
            onChangeText={notes.change}
            multiline
            maxLength={MAX_NOTES_LENGTH}
            placeholder="Plans, ideas, what to watch for…"
            placeholderTextColor={colors.textFaint}
            textAlignVertical="top"
            accessibilityLabel="Notes"
            testID="notes-input"
          />
        )}
        <Text
          style={[styles.status, notes.failed && styles.failed]}
          testID="notes-status"
        >
          {status}
        </Text>
      </View>
    </BottomSheet>
  );
};

export default NotesSheet;

const useStyles = makeStyles((t) => ({
  content: {
    flex: 1,
    gap: t.spacing.sm,
  },
  title: {
    color: t.colors.text,
    fontSize: t.fontSize.xxl,
    fontWeight: t.fontWeight.bold,
  },
  input: {
    flex: 1,
    color: t.colors.text,
    fontSize: t.fontSize.lg,
    padding: t.spacing.md,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
  },
  status: {
    color: t.colors.textMuted,
    fontSize: t.fontSize.sm,
  },
  failed: {
    color: t.colors.danger,
  },
}));
