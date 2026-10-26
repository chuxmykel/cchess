import { View, Text, Pressable, StyleSheet } from 'react-native';

import BottomSheet from '../BottomSheet';
import { useRunAfterDismiss } from '../../hooks/useRunAfterDismiss';

export interface ActionSheetAction {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  testID?: string;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  actions: ActionSheetAction[];
}

const ActionSheet: React.FC<ActionSheetProps> = ({
  visible,
  onClose,
  actions,
}) => {
  const { runAfterDismiss, handleDismiss } = useRunAfterDismiss();

  function chooseAction(action: ActionSheetAction) {
    onClose();
    runAfterDismiss(action.onPress);
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} onDismiss={handleDismiss}>
      <View style={styles.group}>
        {actions.map((action, index) => (
          <Pressable
            key={action.label}
            style={[styles.row, index > 0 && styles.separator]}
            onPress={() => chooseAction(action)}
            accessibilityRole="button"
            testID={action.testID}
          >
            <Text
              style={[styles.label, action.destructive && styles.destructive]}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        style={[styles.group, styles.row, styles.cancel]}
        onPress={onClose}
        accessibilityRole="button"
        testID="action-sheet-cancel"
      >
        <Text style={[styles.label, styles.cancelLabel]}>Cancel</Text>
      </Pressable>
    </BottomSheet>
  );
};

export default ActionSheet;

const styles = StyleSheet.create({
  group: {
    borderRadius: 12,
    backgroundColor: '#f2f2f2',
    overflow: 'hidden',
  },
  row: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  separator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d0d0d0',
  },
  label: {
    fontSize: 17,
    color: '#2f6f3e',
  },
  destructive: {
    color: '#e53935',
  },
  cancel: {
    marginTop: 8,
  },
  cancelLabel: {
    fontWeight: '600',
  },
});
