import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import BottomSheet from '../BottomSheet';
import Button from '../Button';
import ColorChoicePicker from '../ColorChoicePicker';
import {
  DEFAULT_TIME_CONTROL,
  GAME_TYPE_LABELS,
  TIME_CONTROL_GROUPS,
  TimeControl,
} from '../../constants/timeControls';
import { CHALLENGE_FAILED_MESSAGE } from '../../constants/errorMessages';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { ColorChoice } from '../../network/socketEvents';
import { makeStyles, useTheme } from '../../theme';
import { optionRows } from '../TimeControlSelector/optionRows';

export type ChallengeOptions = {
  timeControl: TimeControl;
  rated: boolean;
  color: ColorChoice;
};

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
  const styles = useStyles();
  const { colors } = useTheme();

  const [timeControl, setTimeControl] = useState(DEFAULT_TIME_CONTROL);
  const [rated, setRated] = useState(canPlayRated);
  const [color, setColor] = useState<ColorChoice>('random');
  const sending = useAsyncAction(
    () => onSend({ timeControl, rated: rated && canPlayRated, color }),
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
            <View style={styles.rows}>
              {optionRows(group.options).map((row) => (
                <View key={row[0].label} style={styles.options}>
                  {row.map((option) => {
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
              ))}
            </View>
          </View>
        ))}
        <View style={styles.group}>
          <Text style={styles.groupLabel}>Play as</Text>
          <ColorChoicePicker selected={color} onSelect={setColor} />
        </View>
        {canPlayRated && (
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Rated</Text>
            <Switch
              value={rated}
              onValueChange={setRated}
              trackColor={{ true: colors.accent }}
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

const useStyles = makeStyles((t) => ({
  title: {
    color: t.colors.text,
    fontSize: t.fontSize.xxl,
    fontWeight: t.fontWeight.bold,
    marginTop: t.spacing.xs,
    marginBottom: t.spacing.md,
  },
  group: {
    marginBottom: t.spacing.md,
  },
  groupLabel: {
    fontSize: t.fontSize.md,
    color: t.colors.textMuted,
    marginBottom: t.spacing.sm,
  },
  rows: {
    gap: t.spacing.sm,
  },
  options: {
    flexDirection: 'row',
    gap: t.spacing.sm,
  },
  option: {
    flex: 1,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
    alignItems: 'center',
  },
  selected: {
    backgroundColor: t.colors.accent,
  },
  optionText: {
    fontSize: t.fontSize.base,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.text,
  },
  selectedText: {
    color: t.colors.textOnAccent,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: t.spacing.sm,
  },
  switchLabel: {
    color: t.colors.text,
    fontSize: t.fontSize.xl,
  },
  error: {
    marginTop: t.spacing.md,
    color: t.colors.danger,
  },
  send: {
    marginTop: t.spacing.lg,
  },
}));
