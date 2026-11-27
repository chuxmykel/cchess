import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format, parseISO } from 'date-fns';

import { BadgeMark } from '../BadgeIcon';
import BottomSheet from '../BottomSheet';
import Button from '../Button';
import Icon from '../Icon';
import {
  badgeDescription,
  badgeLabel,
  type BadgeGame,
  type BadgeTile,
} from '../../domain/badges';
import { makeStyles, useTheme } from '../../theme';

const RESULT_LABELS = { win: 'Won', loss: 'Lost', draw: 'Drew' } as const;
// The most games a card lists, the latest; the rest are counted.
export const GAMES_SHOWN = 5;

function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

interface BadgeCardProps {
  // The badge, with each time it was earned - or null for no card.
  tile: BadgeTile | null;
  // Just earned, the card tells them so.
  isNew?: boolean;
  // Your own: Claim, while any is unclaimed.
  onClaim?: (ids: string[]) => void;
  onOpenGame: (gameId: string) => void;
  onClose: () => void;
}

// A badge, up close: its mark, what it's for, when and how often it was
// earned, and the games that earned it - each opening the game. Your own
// badges, not yet claimed, can be claimed here.
const BadgeCard: React.FC<BadgeCardProps> = ({
  tile,
  isNew = false,
  onClaim,
  onOpenGame,
  onClose,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const awards = tile?.awards ?? [];
  const unclaimed = awards.filter((b) => !b.claimedAt);
  const games = awards
    .map((b) => b.game)
    .filter((game): game is BadgeGame => game !== null);

  return (
    <BottomSheet visible={tile !== null} onClose={onClose}>
      {tile && (
        <View style={styles.card} testID="badge-card">
          {isNew && (
            <Text style={styles.kicker} testID="badge-card-new">
              {awards.length > 1
                ? `New badge - your ${ordinal(awards.length)}`
                : 'New badge!'}
            </Text>
          )}
          <View style={awards.length === 0 && styles.unearned}>
            <BadgeMark badge={tile} size={88} />
          </View>
          <Text style={styles.title} testID="badge-card-title">
            {badgeLabel(tile)}
          </Text>
          <Text style={styles.description}>{badgeDescription(tile)}</Text>
          <Text style={styles.earned} testID="badge-card-earned">
            {awards.length === 0
              ? 'Not earned yet'
              : awards.length > 1
                ? `Earned ${awards.length} times - first on ${format(parseISO(awards[awards.length - 1].awardedAt), 'MMM d, yyyy')}`
                : `Earned ${format(parseISO(awards[0].awardedAt), 'MMM d, yyyy')}`}
          </Text>

          {games.length > 0 && (
            <View style={styles.games} testID="badge-card-games">
              {games.slice(0, GAMES_SHOWN).map((game) => (
                <Pressable
                  key={game.gameId}
                  style={styles.game}
                  onPress={() => onOpenGame(game.gameId)}
                  accessibilityRole="button"
                  testID={`badge-card-game-${game.gameId}`}
                >
                  <Text style={styles.gameText} numberOfLines={1}>
                    {game.result ? `${RESULT_LABELS[game.result]} vs ` : 'vs '}
                    {game.opponentDisplayName}
                  </Text>
                  {game.endedAt && (
                    <Text style={styles.gameDate}>
                      {format(parseISO(game.endedAt), 'MMM d')}
                    </Text>
                  )}
                  <Icon
                    name="chevron-right"
                    size={18}
                    color={colors.textMuted}
                  />
                </Pressable>
              ))}
              {games.length > GAMES_SHOWN && (
                <Text style={styles.more} testID="badge-card-more">
                  and {games.length - GAMES_SHOWN} more
                </Text>
              )}
            </View>
          )}

          {onClaim && unclaimed.length > 0 ? (
            <Button
              label="Claim"
              icon="hand-coin-outline"
              onPress={() => onClaim(unclaimed.map((b) => b.id))}
              style={styles.button}
              testID="badge-card-claim"
            />
          ) : (
            <Button
              label="Close"
              variant="outline"
              onPress={onClose}
              style={styles.button}
              testID="badge-card-close"
            />
          )}
        </View>
      )}
    </BottomSheet>
  );
};

export default BadgeCard;

const useStyles = makeStyles((t) => ({
  card: {
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.lg,
    paddingBottom: t.spacing.lg,
  },
  kicker: {
    ...t.typography.label,
    color: t.colors.accentText,
  },
  title: { ...t.typography.title, color: t.colors.text, textAlign: 'center' },
  description: {
    ...t.typography.body,
    color: t.colors.textMuted,
    textAlign: 'center',
  },
  earned: { ...t.typography.caption, color: t.colors.textMuted },
  unearned: { opacity: 0.3 },
  games: {
    alignSelf: 'stretch',
    marginTop: t.spacing.sm,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
  },
  game: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.colors.separator,
  },
  gameText: { flex: 1, ...t.typography.body, color: t.colors.text },
  gameDate: { ...t.typography.caption, color: t.colors.textMuted },
  more: {
    ...t.typography.caption,
    color: t.colors.textMuted,
    textAlign: 'center',
    paddingVertical: t.spacing.sm,
  },
  button: { alignSelf: 'stretch', marginTop: t.spacing.md },
}));
