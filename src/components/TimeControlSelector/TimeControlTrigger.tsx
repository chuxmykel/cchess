import {
  Animated,
  View,
  Text,
  Pressable,
  StyleProp,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';

import GameTypeIcon from '../GameTypeIcon';
import { tintColor } from '../../utils/color';
import { useCaretRotation } from '../../hooks/useCaretRotation';
import {
  TimeControl,
  GAME_TYPE_LABELS,
  GAME_TYPE_COLORS,
} from '../../constants/timeControls';

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
  const { rotateTransform, pulseDipOpacity } = useCaretRotation(sheetOpen);

  const accentColor = GAME_TYPE_COLORS[selected.type];
  const variant = TRIGGER_VARIANT_STYLES[triggerStyleVariant](accentColor);

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
        <Animated.Text style={[styles.caret, rotateTransform, pulseDipOpacity]}>
          {'⏷'}
        </Animated.Text>
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
  (accentColor: string) => TriggerVariantStyle
> = {
  tintedAccentBar: (accent) => ({
    container: {
      backgroundColor: tintColor(accent, 0.88),
      borderRadius: 14,
      borderLeftWidth: 5,
      borderLeftColor: accent,
    },
    label: { color: accent },
  }),
  tintedOutline: (accent) => ({
    container: {
      backgroundColor: tintColor(accent, 0.88),
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: accent,
    },
    label: { color: accent },
  }),
  accentGlow: (accent) => ({
    container: {
      backgroundColor: tintColor(accent, 0.85),
      borderRadius: 16,
      shadowColor: accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    label: { color: accent },
  }),
  boldTint: (accent) => ({
    container: {
      backgroundColor: tintColor(accent, 0.7),
      borderRadius: 14,
      borderLeftWidth: 6,
      borderLeftColor: accent,
    },
    label: { color: accent, fontWeight: '700' },
  }),
  tintedUnderline: (accent) => ({
    container: {
      backgroundColor: tintColor(accent, 0.88),
      borderRadius: 14,
      borderBottomWidth: 3,
      borderBottomColor: accent,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    label: { color: accent },
  }),
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  triggerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  caretContainer: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  caret: {
    fontSize: 20,
    color: '#888',
  },
});
