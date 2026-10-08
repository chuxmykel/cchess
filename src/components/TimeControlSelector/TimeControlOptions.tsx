import { View, Text, Pressable, StyleSheet } from 'react-native';

import GameTypeIcon from '../GameTypeIcon';
import {
  TimeControl,
  TIME_CONTROL_GROUPS,
  GAME_TYPE_LABELS,
} from '../../constants/timeControls';

interface TimeControlOptionsProps {
  selected: TimeControl;
  onSelect: (timeControl: TimeControl) => void;
}

const TimeControlOptions: React.FC<TimeControlOptionsProps> = ({
  selected,
  onSelect,
}) => {
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

const styles = StyleSheet.create({
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  group: {
    paddingVertical: 12,
  },
  groupDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  optionSelected: {
    backgroundColor: '#769656',
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  optionLabelSelected: {
    color: 'white',
  },
});
