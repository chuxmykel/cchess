import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import BottomSheet from '../BottomSheet';
import Button from '../Button';
import Icon from '../Icon';
import { lineAsText } from '../../domain/conditionalMoves';
import { makeStyles } from '../../theme';

interface ConditionalMovesNoteProps {
  /** The game's position the lines start from. */
  fen: string;
  lines: string[][];
  onDelete: () => void;
}

// On a daily game with conditional moves saved: how many lines, opening a
// sheet that lists them and can delete them all.
const ConditionalMovesNote: React.FC<ConditionalMovesNoteProps> = ({
  fen,
  lines,
  onDelete,
}) => {
  const styles = useStyles();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Pressable
        style={styles.note}
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        testID="conditional-moves-note"
      >
        <Icon name="source-branch" size={16} />
        <Text style={styles.noteText}>
          {lines.length} conditional {lines.length === 1 ? 'line' : 'lines'}
        </Text>
      </Pressable>
      <BottomSheet visible={isOpen} onClose={() => setIsOpen(false)}>
        <View style={styles.sheet} testID="conditional-moves-sheet">
          <Text style={styles.title}>Conditional moves</Text>
          <Text style={styles.hint}>
            Each reply is played the moment your opponent makes the move it
            answers.
          </Text>
          {lines.map((line) => (
            <Text key={line.join(' ')} style={styles.line}>
              {lineAsText(fen, line)}
            </Text>
          ))}
          <Button
            label="Delete all"
            variant="outline"
            onPress={() => {
              setIsOpen(false);
              onDelete();
            }}
            testID="delete-conditional-moves-button"
          />
        </View>
      </BottomSheet>
    </>
  );
};

export default ConditionalMovesNote;

const useStyles = makeStyles((t) => ({
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: t.spacing.xs,
    marginTop: t.spacing.sm,
    paddingVertical: t.spacing.xs,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.surface,
  },
  noteText: {
    color: t.colors.text,
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.medium,
  },
  sheet: {
    gap: t.spacing.md,
  },
  title: {
    color: t.colors.text,
    fontSize: t.fontSize.xxl,
    fontWeight: t.fontWeight.bold,
  },
  hint: {
    color: t.colors.textMuted,
    fontSize: t.fontSize.md,
  },
  line: {
    color: t.colors.text,
    fontSize: t.fontSize.lg,
  },
}));
