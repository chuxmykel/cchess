import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { format } from 'date-fns';

import Icon from '../Icon';
import { useNow } from '../../hooks/useNow';
import { makeStyles, useTheme } from '../../theme';

interface MaintenanceBannerProps {
  /** When the server's maintenance is set to begin, or null for no
   * banner. */
  startsAt: Date | null;
}

/** How long the banner stays away once dismissed: it nags, so a player
 * doesn't forget no new live game can start until maintenance is over. */
export const MAINTENANCE_BANNER_SNOOZE_MS = 60_000;

/** What's shown - one line - and what's read aloud: when it begins, until
 * it has. New live games are refused from the announcement either way. */
export function maintenanceMessage(
  startsAt: Date,
  now: number,
): { text: string; label: string } {
  const label =
    'The server restarts once the live games in progress finish. New live games are paused until then.';
  if (now < startsAt.getTime()) {
    const time = format(startsAt, 'p');
    return {
      text: `Maintenance at ${time} · new live games paused`,
      label: `Server maintenance at ${time}. ${label}`,
    };
  }
  return {
    text: 'Maintenance under way · new live games paused',
    label: `Server maintenance under way. ${label}`,
  };
}

/**
 * The server's maintenance, told to a player in a game or seeking one: a
 * red band drawn over the game's header - which it fills, so the board
 * never moves for it. Its ✕ puts it away, bringing the header back, for a
 * minute: then it's back.
 */
const MaintenanceBanner: React.FC<MaintenanceBannerProps> = ({ startsAt }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  // Often enough to change its words as maintenance begins.
  const now = useNow(15_000);
  const [snoozed, setSnoozed] = useState(false);

  useEffect(() => {
    if (!snoozed) return;
    const timer = setTimeout(
      () => setSnoozed(false),
      MAINTENANCE_BANNER_SNOOZE_MS,
    );
    return () => clearTimeout(timer);
  }, [snoozed]);

  if (!startsAt || snoozed) return null;
  const { text, label } = maintenanceMessage(startsAt, now);
  return (
    <View style={styles.banner} testID="maintenance-banner">
      <View
        style={styles.message}
        accessible
        accessibilityRole="alert"
        accessibilityLabel={label}
      >
        <Icon name="wrench-clock" size={18} color={colors.textOnAccent} />
        <Text
          style={styles.text}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {text}
        </Text>
      </View>
      <Pressable
        onPress={() => setSnoozed(true)}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        testID="maintenance-banner-dismiss"
      >
        <Icon name="close" size={20} color={colors.textOnAccent} />
      </Pressable>
    </View>
  );
};

export default MaintenanceBanner;

const useStyles = makeStyles((t) => ({
  banner: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.lg,
    backgroundColor: t.colors.danger,
  },
  message: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  text: {
    flexShrink: 1,
    color: t.colors.textOnAccent,
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.semibold,
  },
}));
