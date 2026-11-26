import { useEffect, useMemo, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import Button from '../../components/Button';
import { BoardArrow, ReviewBoard } from '../../components/Board';
import { ToolbarButton } from '../../components/GameToolbar';
import MoveList from '../../components/MoveList';
import ReviewBubble from '../../components/ReviewBubble';
import ReviewToolbar from '../../components/ReviewToolbar';
import EvalBar from '../../components/EvalBar';
import {
  useGameReviewLoad,
  useReviewSessionContext,
} from '../../context/GameReview/GameReviewContext';
import { defeatedColor } from '../../domain/players';
import { type Chapter, chapterAt } from '../../domain/review/story';
import { isSlip } from '../../domain/review/types';
import { makeStyles, useTheme } from '../../theme';
import type { ReviewStackScreenProps } from './types';

// The room kept above the board for the bubble, under the eval bar: its
// heading and two lines of words - more grows up over the eval bar, then
// down over the board.
const BUBBLE_ROOM = 104;

const THEME_ICONS = {
  opening: 'book-open-page-variant',
  tactics: 'target',
  strategy: 'chess-knight',
  endgame: 'chess-king',
  time: 'timer-outline',
  turns: 'flag-checkered',
} as const;

// "Chapter 2 of 4 · Move 14": where the move shown is in the story.
function chapterStripText(story: Chapter[], index: number): string {
  const at = Math.max(0, chapterAt(story, Math.max(0, index)));
  return `Chapter ${at + 1} of ${story.length} · ${story[at].title}`;
}

type Props = ReviewStackScreenProps<'ReviewMoves'>;

// A review's moves, pushed over its summary: each key moment - or, in the
// cchess style, each chapter, asking for the move at its turning point -
// with what the review makes of it, read aloud; and to close, what to take
// from it. Back - the header's, a swipe or Android's - pops it to the
// summary, which the review is put back to.
const ReviewMovesScreen: React.FC<Props> = ({ navigation }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { analysisAt } = useGameReviewLoad();
  const session = useReviewSessionContext();
  // The eval bar and the room above the board, which the bubble fills from
  // the bottom up.
  const [topRoom, setTopRoom] = useState(BUBBLE_ROOM);

  // Popped, by whatever means: the review's back on its summary.
  const backToSummary = session?.stepper.backToSummary;
  useEffect(() => () => backToSummary?.(), [backToSummary]);

  const viewArrows = session?.view.arrows;
  const arrows = useMemo<BoardArrow[]>(
    () =>
      (viewArrows ?? []).map((arrow) => ({
        from: arrow.from,
        to: arrow.to,
        color: colors.board.arrows[0],
        weight: 0.15,
      })),
    [viewArrows, colors],
  );

  if (!session) return null;
  const {
    review,
    game,
    side,
    settings,
    cchess,
    story,
    stepper,
    isGuessing,
    theme,
    view,
    lastIndex,
    shownIndex,
    moveClasses,
    guesses,
    setScrubbing,
  } = session;
  const atLastMove = shownIndex === lastIndex;
  const slipShown = !!stepper.move && isSlip(stepper.move.moveClass);
  // The list stops before the next move it'll ask for - while asking, or
  // on the way there - since showing it, or what followed, would give it
  // away.
  const nextAsked = guesses.find(
    (g) =>
      !(g in stepper.guessResults) &&
      (isGuessing ? g >= shownIndex : g > shownIndex),
  );
  const listedMoves =
    nextAsked === undefined ? review.moves : review.moves.slice(0, nextAsked);
  const atEnd = stepper.index >= lastIndex + stepper.cards.length;
  const guessTried = stepper.mode.kind === 'guess' ? stepper.mode.tried : null;
  const primary = isGuessing
    ? {
        label: guessTried?.verdict === 'right' ? 'Continue' : 'Reveal',
        onPress: stepper.reveal,
      }
    : atEnd
      ? {
          label: 'Analyse',
          onPress: () =>
            navigation.navigate('AnalysisBoard', {
              source: analysisAt(shownIndex + 1),
            }),
        }
      : stepper.isPlaying
        ? { label: 'Skip', onPress: stepper.next }
        : { label: 'Next', onPress: stepper.next };

  return (
    <View style={styles.screen} testID="game-review-stepping">
      {/* The bubble sits over the top of this, at the foot of the room kept
          for it above the board: words longer than that grow up over the
          eval bar, then on over the board - never pushing it down. */}
      <View>
        <View onLayout={(event) => setTopRoom(event.nativeEvent.layout.height)}>
          {settings.evalBar && (
            <EvalBar
              score={view.score}
              direction="horizontal"
              orientation={side}
            />
          )}
          <View style={styles.bubbleRoom} />
        </View>
        <ReviewBoard
          fen={view.fen}
          width={width}
          orientation={side}
          lastMove={view.lastMove}
          moveClass={view.moveClass}
          markStyle={settings.style}
          arrows={arrows}
          movableColor={view.movableColor}
          onMove={stepper.tryMove}
          defeated={
            atLastMove && stepper.lineStep === null
              ? defeatedColor(game.result)
              : null
          }
        />
        <View
          style={[styles.bubble, { minHeight: topRoom }]}
          pointerEvents="box-none"
        >
          <ReviewBubble
            moveClass={view.bubble.moveClass}
            markStyle={settings.style}
            icon={theme ? THEME_ICONS[theme.theme] : undefined}
            title={view.bubble.title ?? undefined}
            score={view.bubble.score}
            text={view.bubble.text}
            line={view.bubble.line}
            lineAt={view.bubble.lineAt}
          />
        </View>
      </View>
      {cchess && story.length > 0 && !stepper.card && (
        <Text style={styles.chapterStrip} testID="review-chapter-strip">
          {chapterStripText(story, shownIndex)}
        </Text>
      )}
      <View style={styles.moves}>
        <ToolbarButton
          icon="chevron-left"
          label="Back"
          onPress={stepper.back}
          disabled={stepper.index < 0}
          repeatsWhileHeld
          testID="review-back"
        />
        <View style={styles.moveList}>
          <MoveList
            moves={listedMoves}
            currentPly={
              stepper.card
                ? 0
                : isGuessing
                  ? (review.moves[shownIndex - 1]?.ply ?? 0)
                  : (review.moves[shownIndex]?.ply ?? 0)
            }
            onSelectPly={(ply) =>
              stepper.goTo(review.moves.findIndex((m) => m.ply === ply))
            }
            moveClasses={moveClasses}
            markStyle={settings.style}
            endItems={(nextAsked === undefined ? stepper.cards : []).map(
              (card, i) => ({
                key: card.theme,
                icon: THEME_ICONS[card.theme],
                label: card.title,
                selected: stepper.card === card,
                onPress: () => stepper.goTo(lastIndex + 1 + i),
              }),
            )}
            onScrub={stepper.goTo}
            onScrubbingChange={setScrubbing}
          />
        </View>
        <ToolbarButton
          icon="chevron-right"
          label="Forward"
          onPress={stepper.forward}
          disabled={atEnd}
          repeatsWhileHeld
          testID="review-forward"
        />
      </View>
      <View style={styles.footer}>
        {stepper.phase === 'done' ? (
          <View style={styles.doneBar}>
            <Button
              label="Summary"
              variant="outline"
              onPress={navigation.goBack}
              style={styles.doneButton}
              testID="review-summary-button"
            />
            <Button
              label={primary.label}
              onPress={primary.onPress}
              style={styles.doneButton}
              testID="review-next"
            />
          </View>
        ) : (
          <ReviewToolbar
            onRetry={slipShown && !isGuessing ? stepper.retry : undefined}
            showingLine={stepper.lineStep !== null}
            onToggleLine={stepper.toggleLine}
            canShowLine={stepper.canShowLine}
            showingBest={stepper.mode.kind === 'best'}
            onToggleBest={stepper.toggleBest}
            canShowBest={stepper.canShowBest && !isGuessing}
            primaryLabel={primary.label}
            onPrimary={primary.onPress}
          />
        )}
      </View>
    </View>
  );
};

export default ReviewMovesScreen;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    width: '100%',
    backgroundColor: t.colors.background,
  },
  chapterStrip: {
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.accentText,
    textAlign: 'center',
    paddingTop: t.spacing.xs,
  },
  // Room above the board for a comment of a few lines.
  bubbleRoom: {
    height: BUBBLE_ROOM,
  },
  // As tall as the eval bar and the room together, the bubble at its foot
  // - or, a longer one, from the top down.
  bubble: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    zIndex: 1,
  },
  moves: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: t.spacing.xs,
  },
  moveList: {
    flex: 1,
  },
  // The controls sit a little up from the bottom, in easy reach.
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: t.spacing.sm,
    paddingBottom: t.spacing.xxl,
  },
  doneBar: {
    flexDirection: 'row',
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.sm,
  },
  doneButton: {
    flex: 1,
  },
}));
