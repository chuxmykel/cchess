import { Pressable, Text, View } from 'react-native';
import { Color } from 'chess.js';

import BottomSheet from '../BottomSheet';
import Button from '../Button';
import Icon from '../Icon';
import RadioRow from '../RadioRow';
import { CastlingRights } from '../../domain/positionSetup';
import { PositionEditor } from '../../hooks/usePositionEditor';
import { makeStyles, useTheme } from '../../theme';

interface PositionSetupSheetProps {
  visible: boolean;
  editor: PositionEditor;
  onClose: () => void;
}

const TURNS: { key: Color; label: string }[] = [
  { key: 'w', label: 'White to move' },
  { key: 'b', label: 'Black to move' },
];

const CASTLING: { right: keyof CastlingRights; label: string }[] = [
  { right: 'K', label: 'White O-O' },
  { right: 'Q', label: 'White O-O-O' },
  { right: 'k', label: 'Black O-O' },
  { right: 'q', label: 'Black O-O-O' },
];

// The rest of a position being set up: whose move it is, and which castling
// is still allowed - only offered where king and rook stand ready to.
const PositionSetupSheet: React.FC<PositionSetupSheetProps> = ({
  visible,
  editor,
  onClose,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View testID="position-setup-sheet" style={styles.content}>
        <Text style={styles.title}>Position Settings</Text>
        <RadioRow
          options={TURNS}
          selected={editor.setup.turn}
          onSelect={editor.setTurn}
          testIDPrefix="editor-turn-"
        />
        <Text style={styles.heading}>Castling</Text>
        <View style={styles.castling}>
          {CASTLING.map(({ right, label }) => {
            const available = editor.availableCastling[right];
            const checked = editor.setup.castling[right] && available;
            return (
              <Pressable
                key={right}
                onPress={() => editor.toggleCastling(right)}
                disabled={!available}
                style={styles.checkbox}
                hitSlop={6}
                accessibilityRole="checkbox"
                accessibilityState={{ checked, disabled: !available }}
                accessibilityLabel={label}
                testID={`editor-castling-${right}`}
              >
                <Icon
                  name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={22}
                  color={
                    !available
                      ? colors.disabled
                      : checked
                        ? colors.accent
                        : colors.textMuted
                  }
                />
                <Text style={[styles.label, !available && styles.unavailable]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Button
          label="Done"
          onPress={onClose}
          variant="primary"
          testID="position-setup-done"
        />
      </View>
    </BottomSheet>
  );
};

export default PositionSetupSheet;

const useStyles = makeStyles((t) => ({
  content: {
    gap: t.spacing.lg,
  },
  title: {
    fontSize: t.fontSize.xxl,
    fontWeight: t.fontWeight.bold,
    marginTop: t.spacing.xs,
  },
  heading: {
    fontSize: t.fontSize.base,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.textMuted,
  },
  castling: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: t.spacing.md,
  },
  checkbox: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  label: {
    fontSize: t.fontSize.lg,
    color: t.colors.text,
  },
  unavailable: {
    color: t.colors.textMuted,
  },
}));
