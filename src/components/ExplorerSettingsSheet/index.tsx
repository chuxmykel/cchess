import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import BottomSheet from '../BottomSheet';
import Button from '../Button';
import RadioRow from '../RadioRow';
import UserSearchField from '../UserSearchField';
import UserSearchResults from '../UserSearchResults';
import {
  EXPLORER_DB_LABELS,
  EXPLORER_DBS,
  ExplorerSettings,
  LICHESS_RATINGS,
  LICHESS_SPEED_LABELS,
  LICHESS_SPEEDS,
} from '../../constants/explorer';
import { useUserSearch } from '../../hooks/useUserSearch';
import { makeStyles } from '../../theme';

interface ExplorerSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  settings: ExplorerSettings;
  onChange: (change: Partial<ExplorerSettings>) => void;
}

// Each of `choices` that's in `selected`, toggling `choice` - keeping at
// least one.
function toggled<T>(selected: T[], choice: T, choices: readonly T[]): T[] {
  const next = selected.includes(choice)
    ? selected.filter((item) => item !== choice)
    : [...selected, choice];
  return next.length > 0
    ? choices.filter((item) => next.includes(item))
    : selected;
}

// The opening explorer's settings, as lichess's has them: the database -
// Masters, Lichess or a player's games here - then Lichess's time controls
// and rating bands, or the player (you, or anyone searched for) and the
// side they played.
const ExplorerSettingsSheet: React.FC<ExplorerSettingsSheetProps> = ({
  visible,
  onClose,
  settings,
  onChange,
}) => {
  const styles = useStyles();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const search = useUserSearch(searching ? query : '');

  function stopSearching() {
    setSearching(false);
    setQuery('');
  }

  function close() {
    stopSearching();
    onClose();
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      heightRatio={searching ? 0.8 : undefined}
    >
      <View style={searching && styles.fill} testID="explorer-settings">
        <Text style={styles.title}>Opening explorer</Text>

        <Text style={styles.sectionLabel}>Database</Text>
        <RadioRow
          options={EXPLORER_DBS.map((db) => ({
            key: db,
            label: EXPLORER_DB_LABELS[db],
          }))}
          selected={settings.db}
          onSelect={(db) => {
            stopSearching();
            onChange({ db });
          }}
          testIDPrefix="explorer-db-"
        />

        {settings.db === 'lichess' && (
          <>
            <Text style={styles.sectionLabel}>Time controls</Text>
            <View style={styles.chips}>
              {LICHESS_SPEEDS.map((speed) => (
                <Chip
                  key={speed}
                  label={LICHESS_SPEED_LABELS[speed]}
                  selected={settings.speeds.includes(speed)}
                  onPress={() =>
                    onChange({
                      speeds: toggled(settings.speeds, speed, LICHESS_SPEEDS),
                    })
                  }
                  testID={`explorer-speed-${speed}`}
                />
              ))}
            </View>
            <Text style={styles.sectionLabel}>Average rating</Text>
            <View style={styles.chips}>
              {LICHESS_RATINGS.map((rating) => (
                <Chip
                  key={rating}
                  label={String(rating)}
                  selected={settings.ratings.includes(rating)}
                  onPress={() =>
                    onChange({
                      ratings: toggled(
                        settings.ratings,
                        rating,
                        LICHESS_RATINGS,
                      ),
                    })
                  }
                  testID={`explorer-rating-${rating}`}
                />
              ))}
            </View>
          </>
        )}

        {settings.db === 'player' && (
          <>
            <Text style={styles.sectionLabel}>Player</Text>
            {searching ? (
              <View style={styles.fill}>
                <UserSearchField
                  query={query}
                  onChangeQuery={setQuery}
                  autoFocus
                />
                {search.status !== 'idle' && (
                  <UserSearchResults
                    query={query}
                    search={search}
                    onSelect={(user) => {
                      onChange({
                        player: { id: user.id, username: user.username },
                      });
                      stopSearching();
                    }}
                  />
                )}
              </View>
            ) : (
              <>
                <View style={styles.playerRow}>
                  <Text style={styles.player} testID="explorer-player">
                    {settings.player ? `@${settings.player.username}` : 'You'}
                  </Text>
                  {settings.player && (
                    <Pressable
                      onPress={() => onChange({ player: null })}
                      accessibilityRole="button"
                      hitSlop={8}
                      testID="explorer-player-me"
                    >
                      <Text style={styles.link}>Me</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => setSearching(true)}
                    accessibilityRole="button"
                    hitSlop={8}
                    testID="explorer-player-change"
                  >
                    <Text style={styles.link}>Change</Text>
                  </Pressable>
                </View>
                <Text style={styles.sectionLabel}>Played as</Text>
                <RadioRow
                  options={[
                    { key: 'white', label: 'White' },
                    { key: 'black', label: 'Black' },
                  ]}
                  selected={settings.color}
                  onSelect={(color) => onChange({ color })}
                  testIDPrefix="explorer-color-"
                />
              </>
            )}
          </>
        )}

        {!searching && (
          <Button
            label="Done"
            onPress={close}
            variant="primary"
            style={styles.doneButton}
            testID="explorer-settings-done"
          />
        )}
      </View>
    </BottomSheet>
  );
};

const Chip: React.FC<{
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}> = ({ label, selected, onPress, testID }) => {
  const styles = useStyles();
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      testID={testID}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
};

export default ExplorerSettingsSheet;

const useStyles = makeStyles((t) => ({
  fill: {
    flex: 1,
  },
  title: {
    color: t.colors.text,
    fontSize: t.fontSize.xxl,
    fontWeight: t.fontWeight.bold,
    marginTop: t.spacing.xs,
  },
  sectionLabel: {
    color: t.colors.textMuted,
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.semibold,
    marginTop: t.spacing.lg,
    marginBottom: t.spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: t.spacing.sm,
  },
  chip: {
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.colors.separator,
  },
  chipSelected: {
    borderColor: t.colors.accent,
    backgroundColor: t.colors.accentSubtle,
  },
  chipLabel: {
    color: t.colors.text,
    fontSize: t.fontSize.base,
  },
  chipLabelSelected: {
    fontWeight: t.fontWeight.semibold,
    color: t.colors.accent,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.lg,
  },
  player: {
    flex: 1,
    color: t.colors.text,
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.medium,
  },
  link: {
    color: t.colors.accent,
    fontSize: t.fontSize.base,
    fontWeight: t.fontWeight.semibold,
  },
  doneButton: {
    marginTop: t.spacing.xl,
  },
}));
