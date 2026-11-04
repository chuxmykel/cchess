import { View, Text, Pressable, StyleSheet } from 'react-native';

import GameTypeIcon from '../GameTypeIcon';
import {
  TimeControl,
  TIME_CONTROL_GROUPS,
  GAME_TYPE_LABELS,
} from '../../constants/timeControls';
import { makeStyles } from '../../theme';

interface TimeControlOptionsProps {
  selected: TimeControl;
  onSelect: (timeControl: TimeControl) => void;
}

const TimeControlOptions: React.FC<TimeControlOptionsProps> = ({
  selected,
  onSelect,
}) => {
  const styles = useStyles();

  return (
    <>
      <Text style={styles.sheetTitle}>Time Control</Text>
      {TIME_CONTROL_GROUPS.map((group, index) => (
        <View
          key={group.type}
          style={[styles.group, index > 0 && styles.groupDivider]}
        >
          <View style={styles.groupHeader}>
            <GameTypeIcon type={group.type} size={16} />
            <Text style={styles.groupTitle}>
              {GAME_TYPE_LABELS[group.type]}
            </Text>
          </View>
          <View style={styles.optionsRow}>
            {group.options.map((option) => {
              const isSelected =
                option.type === selected.type &&
                option.label === selected.label;
              return (
                <Pressable
                  key={option.label}
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => onSelect(option)}
                  testID={`time-control-option-${option.type}-${option.label}`}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
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
    </>
  );
};

export default TimeControlOptions;

const useStyles = makeStyles((t) => ({
  sheetTitle: {
    fontSize: t.fontSize.xxl,
    fontWeight: t.fontWeight.bold,
    textAlign: 'center',
    marginBottom: t.spacing.sm,
  },
  group: {
    paddingVertical: t.spacing.md,
  },
  groupDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: t.colors.divider,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: t.spacing.md,
    gap: t.spacing.sm,
  },
  groupTitle: {
    fontSize: t.fontSize.base,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.textSecondary,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: t.spacing.sm,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: t.spacing.md,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
  },
  optionSelected: {
    backgroundColor: t.colors.accent,
  },
  optionLabel: {
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.text,
  },
  optionLabelSelected: {
    color: t.colors.textOnAccent,
  },
}));
