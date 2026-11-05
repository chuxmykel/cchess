import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Text,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGameNotes } from '../../hooks/useGameNotes';
import { HomeStackParamList } from '../HomeStack/types';
import { makeStyles, spacing, useTheme } from '../../theme';

const MAX_NOTES_LENGTH = 4000;
// The header's height under the status bar, which the keyboard's room is
// measured from.
const HEADER_HEIGHT = 44;

type GameNotesProps = NativeStackScreenProps<HomeStackParamList, 'GameNotes'>;

// Your own notes on a game - plans, ideas, what to watch for - saved once
// typing pauses and again on leaving, and seen by nobody else.
const GameNotes: React.FC<GameNotesProps> = ({ route }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const notes = useGameNotes(route.params.gameId);

  let status = 'Only you can see these.';
  if (notes.isSaving) status = 'Saving…';
  else if (notes.failed) status = "Couldn't save. Keep typing to try again.";

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior="padding"
      keyboardVerticalOffset={insets.top + HEADER_HEIGHT}
      testID="game-notes"
    >
      {notes.body === null ? (
        <ActivityIndicator color={colors.textMuted} style={styles.loading} />
      ) : (
        <TextInput
          style={styles.input}
          value={notes.body}
          onChangeText={notes.change}
          multiline
          autoFocus={notes.body === ''}
          maxLength={MAX_NOTES_LENGTH}
          placeholder="Plans, ideas, what to watch for…"
          placeholderTextColor={colors.textFaint}
          textAlignVertical="top"
          accessibilityLabel="Notes"
          testID="notes-input"
        />
      )}
      <Text
        style={[
          styles.status,
          { paddingBottom: Math.max(insets.bottom, spacing.md) },
          notes.failed && styles.failed,
        ]}
        testID="notes-status"
      >
        {status}
      </Text>
    </KeyboardAvoidingView>
  );
};

export default GameNotes;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.lg,
    paddingTop: t.spacing.sm,
    backgroundColor: t.colors.background,
  },
  loading: {
    flex: 1,
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
