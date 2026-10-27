import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import BottomSheet from '../BottomSheet';
import Button from '../Button';
import { ACCENT_COLOR, MUTED_COLOR } from '../../constants/colors';
import {
  DEFAULT_TIME_CONTROL,
  GAME_TYPE_LABELS,
  TIME_CONTROL_GROUPS,
  TimeControl,
} from '../../constants/timeControls';
import { CHALLENGE_FAILED_MESSAGE } from '../../constants/errorMessages';
import { useAsyncAction } from '../../hooks/useAsyncAction';

export type ChallengeOptions = { timeControl: TimeControl; rated: boolean };

interface ChallengeSheetProps {
  /** Who is being challenged; the sheet is hidden while null. */
  opponentName: string | null;
  canPlayRated: boolean;
  onClose: () => void;
  onSend: (options: ChallengeOptions) => Promise<void>;
}

const ChallengeSheet: React.FC<ChallengeSheetProps> = ({
  opponentName,
  canPlayRated,
  onClose,
  onSend,
}) => {
  const [timeControl, setTimeControl] = useState(DEFAULT_TIME_CONTROL);
  const [rated, setRated] = useState(canPlayRated);
  const sending = useAsyncAction(
    () => onSend({ timeControl, rated: rated && canPlayRated }),
    CHALLENGE_FAILED_MESSAGE,
  );

  async function send() {
    if (await sending.run()) {
      onClose();
    }
  }

  return (
    <BottomSheet visible={opponentName !== null} onClose={onClose}>
      <View testID="challenge-sheet">
        <Text style={styles.title}>Challenge {opponentName}</Text>
        {TIME_CONTROL_GROUPS.map((group) => (
          <View key={group.type} style={styles.group}>
            <Text style={styles.groupLabel}>
              {GAME_TYPE_LABELS[group.type]}
            </Text>
            <View style={styles.options}>
              {group.options.map((option) => {
                const isSelected = option === timeControl;
                return (
                  <Pressable
                    key={option.label}
                    style={[styles.option, isSelected && styles.selected]}
                    onPress={() => setTimeControl(option)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    testID={`challenge-time-${option.label}`}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.selectedText,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        {canPlayRated && (
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Rated</Text>
            <Switch
              value={rated}
              onValueChange={setRated}
              trackColor={{ true: ACCENT_COLOR }}
              accessibilityLabel="Rated"
              testID="challenge-rated-switch"
            />
          </View>
        )}
        {sending.errorMessage && (
          <Text style={styles.error} testID="challenge-error">
            {sending.errorMessage}
          </Text>
        )}
        <Button
          label="Send challenge"
          onPress={send}
          disabled={sending.isRunning}
          style={styles.send}
          testID="send-challenge-button"
        />
      </View>
    </BottomSheet>
  );
};

export default ChallengeSheet;

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 12,
  },
  group: {
    marginBottom: 10,
  },
  groupLabel: {
    fontSize: 13,
    color: MUTED_COLOR,
    marginBottom: 6,
  },
  options: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
  },
  selected: {
    backgroundColor: ACCENT_COLOR,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedText: {
    color: 'white',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  switchLabel: {
    fontSize: 16,
  },
  error: {
    marginTop: 10,
    color: '#d33',
  },
  send: {
    marginTop: 16,
  },
});
