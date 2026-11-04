import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Color } from 'chess.js';

import BottomSheet from '../BottomSheet';
import Button from '../Button';
import Icon from '../Icon';
import RadioRow from '../RadioRow';
import { ACCENT_COLOR, MUTED_COLOR } from '../../constants/colors';
import { CastlingRights } from '../../domain/positionSetup';
import { PositionEditor } from '../../hooks/usePositionEditor';

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
}) => (
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
                  !available ? '#ccc' : checked ? ACCENT_COLOR : MUTED_COLOR
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

export default PositionSetupSheet;

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  heading: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED_COLOR,
  },
  castling: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  checkbox: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 15,
    color: '#222',
  },
  unavailable: {
    color: MUTED_COLOR,
  },
});
