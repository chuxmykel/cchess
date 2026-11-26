import { Pressable, Text, View } from 'react-native';
import { Color, Square } from 'chess.js';

import BadgeIcon from '../BadgeIcon';
import { PositionBoard } from '../Board';
import {
  BADGE_DESCRIPTIONS,
  BADGE_LABELS,
  type BadgeKind,
} from '../../domain/review/badges';
import {
  MARK_CLASSES,
  MARK_GLYPHS,
  markCounts,
} from '../../domain/review/marks';
import type { Names } from '../../domain/review/phrases';
import type { Chapter, DecisiveMoment } from '../../domain/review/story';
import type { ReviewedMove, SideReview } from '../../domain/review/types';
import { makeStyles, useTheme } from '../../theme';

interface CchessReviewSummaryProps {
  moves: ReviewedMove[];
  names: Names;
  white: SideReview;
  black: SideReview;
  // The side reviewed, its board turned for and its column set off.
  side: Color;
  decisive: { moment: DecisiveMoment | null; text: string };
  story: Chapter[];
  // How many of the turning points asked about were found, once any were.
  guesses: { found: number; asked: number } | null;
  // The side's hardest find: its move, and how hard ("Only move").
  hardest?: { san: string; label: string } | null;
  // What the game earned the side reviewed.
  badges?: BadgeKind[];
  // A tap on the decisive moment goes to its move; on a chapter, starts the
  // review there.
  onSelectMove: (index: number) => void;
  onStartChapter: (chapter: number) => void;
}

const DECISIVE_BOARD = 112;
const CHAPTER_BOARD = 64;

const squaresOf = (uci: string) => ({
  from: uci.slice(0, 2) as Square,
  to: uci.slice(2, 4) as Square,
});

// The cchess review at a glance: the move that decided the game, the game
// in chapters, and each side's accuracy and marked moves - no rating.
const CchessReviewSummary: React.FC<CchessReviewSummaryProps> = ({
  moves,
  names,
  white,
  black,
  side,
  decisive,
  story,
  guesses,
  hardest = null,
  badges = [],
  onSelectMove,
  onStartChapter,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const { moment } = decisive;
  const decided = moment ? moves[moment.index] : null;
  const counts = { w: markCounts(moves, 'w'), b: markCounts(moves, 'b') };
  const accuracy = { w: white.accuracy, b: black.accuracy };

  return (
    <View style={styles.summary} testID="cchess-summary">
      <Pressable
        style={styles.card}
        onPress={moment ? () => onSelectMove(moment.index) : undefined}
        disabled={!moment}
        accessibilityRole={moment ? 'button' : undefined}
        testID="review-decisive"
      >
        {decided && (
          <PositionBoard
            fen={decided.fenAfter}
            width={DECISIVE_BOARD}
            orientation={side}
            lastMove={squaresOf(decided.uci)}
            coordinates={false}
          />
        )}
        <View style={styles.cardText}>
          <Text style={styles.kicker}>
            {decided
              ? `Decided at move ${Math.ceil(decided.ply / 2)}`
              : 'No decisive move'}
          </Text>
          <Text style={styles.body} testID="review-decisive-text">
            {decisive.text}
          </Text>
        </View>
      </Pressable>

      {badges.length > 0 && (
        <View style={styles.badges} testID="review-badges">
          {badges.map((kind) => (
            <View
              key={kind}
              style={styles.badge}
              testID={`review-badge-${kind}`}
            >
              <BadgeIcon kind={kind} size={32} />
              <View style={styles.cardText}>
                <Text style={styles.badgeTitle}>{BADGE_LABELS[kind]}</Text>
                <Text style={styles.small}>{BADGE_DESCRIPTIONS[kind]}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {story.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>The game in chapters</Text>
            {guesses && (
              <Text style={styles.tally} testID="review-guess-tally">
                {guesses.found} of {guesses.asked} found
              </Text>
            )}
          </View>
          {story.map((chapter, i) => {
            const last = moves[chapter.end];
            return (
              <Pressable
                key={`${chapter.kind}-${chapter.start}`}
                style={styles.chapter}
                onPress={() => onStartChapter(i)}
                accessibilityRole="button"
                testID={`review-chapter-${i}`}
              >
                <PositionBoard
                  fen={last.fenAfter}
                  width={CHAPTER_BOARD}
                  orientation={side}
                  lastMove={chapter.turn !== null ? squaresOf(last.uci) : null}
                  coordinates={false}
                />
                <View style={styles.cardText}>
                  <Text
                    style={[
                      styles.chapterTitle,
                      chapter.turn !== null && { color: colors.accentText },
                    ]}
                  >
                    {chapter.title}
                  </Text>
                  <Text style={styles.small}>{chapter.text}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.section} testID="review-marks">
        <View style={styles.row}>
          <Text style={styles.label} />
          {(['w', 'b'] as Color[]).map((color) => (
            <Text
              key={color}
              style={[styles.cell, styles.name]}
              numberOfLines={1}
            >
              {names[color]}
            </Text>
          ))}
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Accuracy</Text>
          {(['w', 'b'] as Color[]).map((color) => (
            <Text
              key={color}
              style={[
                styles.cell,
                styles.accuracy,
                color === side && { color: colors.accentText },
              ]}
              testID={`review-accuracy-${color}`}
            >
              {accuracy[color].toFixed(1)}
            </Text>
          ))}
        </View>
        {hardest && (
          <View style={styles.row}>
            <Text style={styles.label}>Hardest find</Text>
            <Text style={styles.hardest} testID="review-hardest-find">
              {hardest.san} · {hardest.label}
            </Text>
          </View>
        )}
        {MARK_GLYPHS.map((glyph) => (
          <View key={glyph} style={styles.row}>
            <Text
              style={[
                styles.label,
                styles.glyph,
                { color: colors.moveClass[MARK_CLASSES[glyph]] },
              ]}
            >
              {glyph}
            </Text>
            {(['w', 'b'] as Color[]).map((color) => (
              <Text
                key={color}
                style={[styles.cell, styles.count]}
                testID={`review-marks-${color}-${glyph}`}
              >
                {counts[color][glyph]}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

export default CchessReviewSummary;

const useStyles = makeStyles((t) => ({
  summary: {
    gap: t.spacing.lg,
  },
  card: {
    flexDirection: 'row',
    gap: t.spacing.md,
    padding: t.spacing.md,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
  },
  cardText: {
    flex: 1,
    gap: t.spacing.xs,
  },
  kicker: {
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.bold,
    color: t.colors.text,
  },
  body: {
    fontSize: t.fontSize.md,
    color: t.colors.textSecondary,
  },
  badges: {
    gap: t.spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    padding: t.spacing.sm,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
  },
  badgeTitle: {
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.bold,
    color: t.colors.text,
  },
  section: {
    gap: t.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.bold,
    color: t.colors.text,
  },
  tally: {
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.accentText,
  },
  chapter: {
    flexDirection: 'row',
    gap: t.spacing.md,
    padding: t.spacing.sm,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
  },
  chapterTitle: {
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.bold,
    color: t.colors.text,
  },
  small: {
    fontSize: t.fontSize.sm,
    color: t.colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
  },
  label: {
    flex: 1,
    fontSize: t.fontSize.md,
    color: t.colors.text,
  },
  glyph: {
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.bold,
  },
  cell: {
    width: 88,
    textAlign: 'center',
    color: t.colors.text,
  },
  name: {
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.semibold,
  },
  accuracy: {
    fontSize: t.fontSize.xl,
    fontWeight: t.fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  hardest: {
    width: 176,
    textAlign: 'center',
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.accentText,
  },
  count: {
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
}));
