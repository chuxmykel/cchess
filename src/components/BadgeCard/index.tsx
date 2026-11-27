import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { format, parseISO } from 'date-fns';

import { BadgeMark } from '../BadgeIcon';
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

interface BadgeCardProps {
  // The badge, with each time it was earned - or null for no card.
  tile: BadgeTile | null;
  onOpenGame: (gameId: string) => void;
  onClose: () => void;
}

// A badge, up close, in a card over the screen: its mark, what it's for,
// when and how often it was earned, and the games that earned it - each
// opening the game. A tap outside, or ✕, puts it away.
const BadgeCard: React.FC<BadgeCardProps> = ({ tile, onOpenGame, onClose }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const awards = tile?.awards ?? [];
  const games = awards
    .map((b) => b.game)
    .filter((game): game is BadgeGame => game !== null);

  return (
    <Modal
      visible={tile !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Close"
        testID="badge-card-backdrop"
      >
        {tile && (
          // Taps on the card stay on it.
          <Pressable style={styles.card} onPress={() => {}} testID="badge-card">
            <Pressable
              style={styles.close}
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
              testID="badge-card-close"
            >
              <Icon name="close" size={20} color={colors.textMuted} />
            </Pressable>
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
                      {game.result
                        ? `${RESULT_LABELS[game.result]} vs `
                        : 'vs '}
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
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
};

export default BadgeCard;

const useStyles = makeStyles((t) => ({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: t.spacing.xl,
    backgroundColor: t.colors.scrim,
  },
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: t.spacing.sm,
    padding: t.spacing.lg,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.background,
    ...t.elevation.lg,
    shadowColor: t.colors.shadow,
  },
  close: { position: 'absolute', top: t.spacing.md, right: t.spacing.md },
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
}));
