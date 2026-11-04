import { useState } from 'react';
import { View, Text, Pressable, Switch } from 'react-native';

import BottomSheet from '../BottomSheet';
import Button from '../Button';
import Icon from '../Icon';
import ColorChoicePicker from '../ColorChoicePicker';
import RatingRangeSelector from '../RatingRangeSelector';
import Toast from '../Toast';
import { useToast } from '../../hooks/useToast';
import { ColorChoice, RatingRange } from '../../network/socketEvents';
import { makeStyles, useTheme } from '../../theme';

const SIGN_IN_TO_PLAY_RATED = 'Sign in to play rated games.';

interface GameSettingsProps {
  rated: boolean;
  ratingRange: RatingRange;
  color: ColorChoice;
  onChangeColor: (color: ColorChoice) => void;
  canPlayRated: boolean;
  onChangeRated: (rated: boolean) => void;
  onChangeRatingRange: (range: RatingRange) => void;
}

const GameSettings: React.FC<GameSettingsProps> = ({
  rated,
  ratingRange,
  color,
  onChangeColor,
  canPlayRated,
  onChangeRated,
  onChangeRatingRange,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();

  const [sheetOpen, setSheetOpen] = useState(false);
  const toast = useToast();

  function changeRated(nextRated: boolean) {
    if (canPlayRated) {
      onChangeRated(nextRated);
    } else {
      toast.show(SIGN_IN_TO_PLAY_RATED);
    }
  }

  return (
    <View>
      <Pressable
        onPress={() => setSheetOpen(true)}
        style={styles.trigger}
        hitSlop={8}
        accessibilityRole="button"
        testID="game-settings-trigger"
      >
        <Icon name="cog-outline" size={18} color={colors.textMuted} />
        <Text style={styles.triggerLabel}>Game Settings</Text>
      </Pressable>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        overlay={<Toast toasts={toast.toasts} />}
      >
        <Text style={styles.title}>Game Settings</Text>

        <Text style={[styles.sectionLabel, styles.firstSection]}>Play as</Text>
        <ColorChoicePicker selected={color} onSelect={onChangeColor} />
        <View style={styles.sectionGap} />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Rated</Text>
          <Switch
            value={rated}
            onValueChange={changeRated}
            trackColor={{ true: colors.accent }}
            accessibilityLabel="Rated"
            testID="rated-switch"
          />
        </View>

        {canPlayRated ? (
          <>
            <Text style={styles.sectionLabel}>Rating Range</Text>
            <RatingRangeSelector
              range={ratingRange}
              onChange={onChangeRatingRange}
            />
          </>
        ) : (
          <Text style={styles.hint}>{SIGN_IN_TO_PLAY_RATED}</Text>
        )}

        <Button
          label="Done"
          onPress={() => setSheetOpen(false)}
          variant="primary"
          style={styles.doneButton}
          testID="game-settings-done"
        />
      </BottomSheet>
    </View>
  );
};

export default GameSettings;

const useStyles = makeStyles((t) => ({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: t.spacing.sm,
    marginTop: t.spacing.md,
  },
  triggerLabel: {
    fontSize: t.fontSize.base,
    fontWeight: t.fontWeight.medium,
    color: t.colors.textMuted,
  },
  title: {
    fontSize: t.fontSize.xxl,
    fontWeight: t.fontWeight.bold,
    marginTop: t.spacing.xs,
    marginBottom: t.spacing.lg,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: t.fontSize.xl,
    fontWeight: t.fontWeight.medium,
    color: t.colors.text,
  },
  sectionLabel: {
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: t.spacing.xl,
    marginBottom: t.spacing.md,
  },
  firstSection: {
    marginTop: 0,
  },
  sectionGap: {
    height: 20,
  },
  hint: {
    marginTop: t.spacing.sm,
    fontSize: t.fontSize.md,
    color: t.colors.textMuted,
  },
  doneButton: {
    marginTop: t.spacing.xxl,
  },
}));
