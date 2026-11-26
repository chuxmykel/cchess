import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Color, Square } from 'chess.js';

import AppLogo from '../AppLogo';
import BadgeIcon from '../BadgeIcon';
import { PositionBoard } from '../Board';
import { BADGE_LABELS, type BadgeKind } from '../../domain/review/badges';
import {
  COLOR_THEMES,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from '../../theme';

// The card is always cchess's own colours - Paper & Vermilion - whatever the
// app's theme, since it leaves the app as a picture.
const CARD = COLOR_THEMES.vermilion.light.colors;

export const SHARE_CARD_WIDTH = 320;
const BOARD = SHARE_CARD_WIDTH - 2 * spacing.lg;

interface ReviewShareCardProps {
  // The position after the move that decided the game, and that move.
  fen: string;
  lastMove: { from: Square; to: Square } | null;
  orientation: Color;
  headline: string;
  text: string;
  // The side reviewed: its name and accuracy.
  name: string;
  accuracy: number;
  badge: BadgeKind | null;
}

// A review's best moment, as a picture to share: the decisive move on a
// board, what it did, the side's accuracy and a badge it earned, under the
// cchess mark.
const ReviewShareCard = forwardRef<
  React.ComponentRef<typeof View>,
  ReviewShareCardProps
>(
  (
    { fen, lastMove, orientation, headline, text, name, accuracy, badge },
    ref,
  ) => (
    <View
      ref={ref}
      collapsable={false}
      style={styles.card}
      testID="review-share-card"
    >
      <View style={styles.header}>
        <AppLogo size={28} colors={CARD.logo} />
        <Text style={styles.brand}>cchess</Text>
      </View>
      <PositionBoard
        fen={fen}
        width={BOARD}
        orientation={orientation}
        lastMove={lastMove}
        coordinates={false}
      />
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.text}>{text}</Text>
      <View style={styles.footer}>
        <Text style={styles.player} numberOfLines={1}>
          {name} · {accuracy.toFixed(1)}% accuracy
        </Text>
        {badge && (
          <View style={styles.badge}>
            <BadgeIcon kind={badge} size={22} />
            <Text style={styles.badgeText}>{BADGE_LABELS[badge]}</Text>
          </View>
        )}
      </View>
    </View>
  ),
);

ReviewShareCard.displayName = 'ReviewShareCard';

export default ReviewShareCard;

const styles = StyleSheet.create({
  card: {
    width: SHARE_CARD_WIDTH,
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: CARD.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brand: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: CARD.text,
  },
  headline: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: CARD.accentText,
  },
  text: {
    fontSize: fontSize.base,
    color: CARD.text,
  },
  footer: {
    gap: spacing.sm,
  },
  player: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: CARD.textMuted,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badgeText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: CARD.text,
  },
});
