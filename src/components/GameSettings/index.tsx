import { useState } from 'react';
import { View, Text, Pressable, Switch, StyleSheet } from 'react-native';

import BottomSheet from '../BottomSheet';
import Button from '../Button';
import Icon from '../Icon';
import RatingRangeSelector from '../RatingRangeSelector';
import Toast from '../Toast';
import { useToast } from '../../hooks/useToast';
import { ACCENT_COLOR, MUTED_COLOR } from '../../constants/colors';
import { RatingRange } from '../../network/socketEvents';

const SIGN_IN_TO_PLAY_RATED = 'Sign in to play rated games.';

interface GameSettingsProps {
  rated: boolean;
  ratingRange: RatingRange;
  canPlayRated: boolean;
  onChangeRated: (rated: boolean) => void;
  onChangeRatingRange: (range: RatingRange) => void;
}

const GameSettings: React.FC<GameSettingsProps> = ({
  rated,
  ratingRange,
  canPlayRated,
  onChangeRated,
  onChangeRatingRange,
}) => {
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
        <Icon name="cog-outline" size={18} color={MUTED_COLOR} />
        <Text style={styles.triggerLabel}>Game Settings</Text>
      </Pressable>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        overlay={<Toast toasts={toast.toasts} />}
      >
        <Text style={styles.title}>Game Settings</Text>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Rated</Text>
          <Switch
            value={rated}
            onValueChange={changeRated}
            trackColor={{ true: ACCENT_COLOR }}
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

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 12,
  },
  triggerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: MUTED_COLOR,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTED_COLOR,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 12,
  },
  hint: {
    marginTop: 8,
    fontSize: 13,
    color: MUTED_COLOR,
  },
  doneButton: {
    marginTop: 28,
  },
});
