import { Pressable, StyleSheet, Text, View } from 'react-native';

import CountPill from '../CountPill';
import Icon, { IconName } from '../Icon';
import Popover, { POPOVER_TRIGGER_HIT_SLOP } from '../Popover';
import { usePopoverMenu } from '../../hooks/usePopoverMenu';
import { makeStyles, useTheme } from '../../theme';

const MENU_WIDTH = 200;
const TICK_SIZE = 18;

interface DropdownProps<Value extends string> {
  /** Each choice - with how many it matches, if given, in a pill. */
  options: { key: Value; label: string; count?: number }[];
  value: Value;
  onChange: (value: Value) => void;
  /** Before the label - what it chooses. */
  icon: IconName;
  /** What the choice is, read out before it: "Sort", "Result". */
  accessibilityName: string;
  /** Its menu is `<testID>-menu`, and each option `<testID>-<key>`. */
  testID: string;
}

// A choice of a few, shown as the one chosen: tapped, a menu of them all,
// the chosen one ticked. Options with a count show it, the chosen one's
// beside it in the trigger too.
function Dropdown<Value extends string>({
  options,
  value,
  onChange,
  icon,
  accessibilityName,
  testID,
}: DropdownProps<Value>) {
  const styles = useStyles();
  const { colors } = useTheme();

  const { triggerRef, visible, position, open, close } =
    usePopoverMenu(MENU_WIDTH);
  const chosen = options.find((each) => each.key === value);
  const label = chosen?.label;

  function select(selected: Value) {
    close();
    onChange(selected);
  }

  return (
    <>
      <Pressable
        ref={triggerRef}
        style={styles.trigger}
        onPress={open}
        hitSlop={POPOVER_TRIGGER_HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityName}: ${label}`}
        testID={testID}
      >
        <Icon name={icon} size={18} color={colors.textMuted} />
        <Text style={styles.label}>{label}</Text>
        {chosen?.count !== undefined && (
          <CountPill count={chosen.count} testID={`${testID}-count`} />
        )}
        <Icon name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>
      <Popover
        visible={visible}
        position={position}
        onClose={close}
        width={MENU_WIDTH}
        contentStyle={styles.menu}
        testID={`${testID}-menu`}
      >
        {options.map((each) => {
          const isSelected = each.key === value;
          return (
            <Pressable
              key={each.key}
              style={styles.option}
              onPress={() => select(each.key)}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: isSelected }}
              testID={`${testID}-${each.key}`}
            >
              <Text
                style={[styles.optionLabel, isSelected && styles.selectedLabel]}
              >
                {each.label}
              </Text>
              {each.count !== undefined && (
                <CountPill
                  count={each.count}
                  testID={`${testID}-${each.key}-count`}
                />
              )}
              {/* The tick's room kept on every row, lining the counts up. */}
              <View style={styles.tick}>
                {isSelected && (
                  <Icon name="check" size={TICK_SIZE} color={colors.accent} />
                )}
              </View>
            </Pressable>
          );
        })}
      </Popover>
    </>
  );
}

export default Dropdown;

const useStyles = makeStyles((t) => ({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
  },
  label: {
    fontSize: t.fontSize.base,
    color: t.colors.textMuted,
  },
  // A visible edge and a lift off the page, like the rating category
  // dropdown.
  menu: {
    paddingVertical: t.spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.border,
    borderRadius: t.radius.lg,
    ...t.elevation.lg,
    shadowColor: t.colors.shadow,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
  },
  tick: {
    width: TICK_SIZE,
  },
  optionLabel: {
    color: t.colors.text,
    flex: 1,
    fontSize: t.fontSize.lg,
  },
  selectedLabel: {
    fontWeight: t.fontWeight.semibold,
    color: t.colors.accent,
  },
}));
