import {
  Animated,
  View,
  Text,
  Pressable,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';

import GameTypeIcon from '../GameTypeIcon';
import Icon from '../Icon';
import { tintColor } from '../../utils/color';
import { useCaretRotation } from '../../hooks/useCaretRotation';
import { TimeControl, GAME_TYPE_LABELS } from '../../constants/timeControls';
import { makeStyles, Theme, useTheme } from '../../theme';

export type TriggerStyleVariant =
  | 'tintedAccentBar'
  | 'tintedOutline'
  | 'accentGlow'
  | 'boldTint'
  | 'tintedUnderline';

export const TRIGGER_STYLE_VARIANTS: {
  id: TriggerStyleVariant;
  label: string;
}[] = [
  { id: 'tintedAccentBar', label: 'Tinted Bar' },
  { id: 'tintedOutline', label: 'Tinted Outline' },
  { id: 'accentGlow', label: 'Accent Glow' },
  { id: 'boldTint', label: 'Bold Tint' },
  { id: 'tintedUnderline', label: 'Tinted Underline' },
];

interface TimeControlTriggerProps {
  selected: TimeControl;
  sheetOpen: boolean;
  onPress: () => void;
  triggerStyleVariant?: TriggerStyleVariant;
  showTypeName?: boolean;
}

const TimeControlTrigger: React.FC<TimeControlTriggerProps> = ({
  selected,
  sheetOpen,
  onPress,
  triggerStyleVariant = 'tintedAccentBar',
  showTypeName = true,
}) => {
  const theme = useTheme();
  const styles = useStyles();

  const { rotateTransform, pulseDipOpacity } = useCaretRotation(sheetOpen);

  // The tint fades the type's color toward the background, in either mode.
  const accentColor = theme.colors.gameType[selected.type];
  const variant = TRIGGER_VARIANT_STYLES[triggerStyleVariant](
    accentColor,
    theme,
  );

  return (
    <Pressable
      style={[styles.trigger, variant.container]}
      onPress={onPress}
      testID="time-control-trigger"
    >
      <GameTypeIcon type={selected.type} size={22} />
      <Text style={[styles.triggerLabel, variant.label]}>
        {showTypeName
          ? `${GAME_TYPE_LABELS[selected.type]} · ${selected.label}`
          : selected.label}
      </Text>
      <View style={styles.caretContainer}>
        <Animated.View style={[rotateTransform, pulseDipOpacity]}>
          <Icon name="chevron-down" size={24} color={theme.colors.textMuted} />
        </Animated.View>
      </View>
    </Pressable>
  );
};

export default TimeControlTrigger;

interface TriggerVariantStyle {
  container: StyleProp<ViewStyle>;
  label?: StyleProp<TextStyle>;
}

const TRIGGER_VARIANT_STYLES: Record<
  TriggerStyleVariant,
  (accentColor: string, theme: Theme) => TriggerVariantStyle
> = {
  tintedAccentBar: (accent, t) => ({
    container: {
      backgroundColor: tintColor(accent, 0.88, t.colors.background),
      borderRadius: t.radius.lg,
      borderLeftWidth: 5,
      borderLeftColor: accent,
    },
    label: { color: accent },
  }),
  tintedOutline: (accent, t) => ({
    container: {
      backgroundColor: tintColor(accent, 0.88, t.colors.background),
      borderRadius: t.radius.lg,
      borderWidth: 1.5,
      borderColor: accent,
    },
    label: { color: accent },
  }),
  accentGlow: (accent, t) => ({
    container: {
      backgroundColor: tintColor(accent, 0.85, t.colors.background),
      borderRadius: t.radius.xl,
      shadowColor: accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    label: { color: accent },
  }),
  boldTint: (accent, t) => ({
    container: {
      backgroundColor: tintColor(accent, 0.7, t.colors.background),
      borderRadius: t.radius.lg,
      borderLeftWidth: 6,
      borderLeftColor: accent,
    },
    label: { color: accent, fontWeight: t.fontWeight.bold },
  }),
  tintedUnderline: (accent, t) => ({
    container: {
      backgroundColor: tintColor(accent, 0.88, t.colors.background),
      borderRadius: t.radius.lg,
      borderBottomWidth: 3,
      borderBottomColor: accent,
      ...t.elevation.sm,
      shadowColor: t.colors.shadow,
      shadowOpacity: 0.08,
    },
    label: { color: accent },
  }),
};

const useStyles = makeStyles((t) => ({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: t.spacing.lg,
    paddingHorizontal: t.spacing.lg,
    gap: t.spacing.sm,
  },
  triggerLabel: {
    fontSize: t.fontSize.xl,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.text,
  },
  caretContainer: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));
