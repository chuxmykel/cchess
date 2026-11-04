import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import Icon from '../Icon';
import RadioRow from '../RadioRow';
import {
  AppearanceSettings,
  ColorSchemePreference,
} from '../../constants/appearance';
import {
  BOARD_THEME_LABELS,
  BOARD_THEMES,
  BoardThemeName,
  makeStyles,
  useTheme,
} from '../../theme';

interface AppearanceSettingsFormProps {
  settings: AppearanceSettings;
  onChange: (change: Partial<AppearanceSettings>) => void;
}

const COLOR_SCHEMES: { key: ColorSchemePreference; label: string }[] = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

const BOARD_THEME_NAMES = Object.keys(BOARD_THEME_LABELS) as BoardThemeName[];

// Light or dark mode, and the board's colors.
const AppearanceSettingsForm: React.FC<AppearanceSettingsFormProps> = ({
  settings,
  onChange,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID="appearance-settings"
    >
      <View style={styles.section}>
        <Text style={styles.label}>Theme</Text>
        <RadioRow
          options={COLOR_SCHEMES}
          selected={settings.colorScheme}
          onSelect={(colorScheme) => onChange({ colorScheme })}
          testIDPrefix="color-scheme-"
        />
        <Text style={styles.hint}>
          System follows your device, switching between light and dark with it.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Board</Text>
        <View accessibilityRole="radiogroup">
          {BOARD_THEME_NAMES.map((name) => {
            const isSelected = name === settings.boardTheme;
            const board = BOARD_THEMES[name];
            return (
              <Pressable
                key={name}
                onPress={() => onChange({ boardTheme: name })}
                style={styles.boardRow}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={BOARD_THEME_LABELS[name]}
                testID={`board-theme-${name}`}
              >
                <View style={styles.swatch}>
                  {[board.light, board.dark, board.dark, board.light].map(
                    (color, index) => (
                      <View
                        key={index}
                        style={[
                          styles.swatchSquare,
                          { backgroundColor: color },
                        ]}
                      />
                    ),
                  )}
                </View>
                <Text
                  style={[styles.boardLabel, isSelected && styles.selected]}
                >
                  {BOARD_THEME_LABELS[name]}
                </Text>
                {isSelected && (
                  <Icon name="check" size={20} color={colors.accent} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

export default AppearanceSettingsForm;

const SWATCH_SIZE = 32;
const SWATCH_SQUARE = (SWATCH_SIZE - 2 * StyleSheet.hairlineWidth) / 2;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  content: {
    padding: t.spacing.lg,
    gap: t.spacing.lg,
  },
  section: {
    gap: t.spacing.md,
    paddingBottom: t.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.colors.divider,
  },
  label: {
    fontSize: t.fontSize.xl,
    fontWeight: t.fontWeight.medium,
    color: t.colors.text,
  },
  hint: {
    fontSize: t.fontSize.md,
    color: t.colors.textMuted,
  },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingVertical: t.spacing.sm,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: t.radius.xs,
    // So a white square stays a square on a white screen.
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.border,
    overflow: 'hidden',
  },
  swatchSquare: {
    width: SWATCH_SQUARE,
    height: SWATCH_SQUARE,
  },
  boardLabel: {
    flex: 1,
    fontSize: t.fontSize.lg,
    color: t.colors.textSecondary,
  },
  selected: {
    color: t.colors.text,
    fontWeight: t.fontWeight.semibold,
  },
}));
