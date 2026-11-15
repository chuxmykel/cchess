import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Color } from 'chess.js';

import Button from '../../components/Button';
import EvalBar from '../../components/EvalBar';
import EvalGraph from '../../components/EvalGraph';
import { ToolbarButton } from '../../components/GameToolbar';
import { BoardArrow, ReviewBoard } from '../../components/Board';
import MoveList from '../../components/MoveList';
import ReviewBubble from '../../components/ReviewBubble';
import ReviewSummary from '../../components/ReviewSummary';
import ReviewToolbar from '../../components/ReviewToolbar';
import { ReviewSettings } from '../../constants/review';
import { defeatedColor } from '../../domain/players';
import { introLine, IntroContext, seedOf } from '../../domain/review/phrases';
import { themeCards } from '../../domain/review/themes';
import type { GameReview, MoveClass } from '../../domain/review/types';
import { reviewView } from '../../hooks/reviewView';
import { useMoveNavigationSounds } from '../../hooks/useGameSounds';
import { useRetryJudge } from '../../hooks/useRetryJudge';
import { useReviewStepper } from '../../hooks/useReviewStepper';
import { useReviewVoice } from '../../hooks/useReviewVoice';
import type { GameSnapshot } from '../../network/socketEvents';
import { makeStyles, useTheme } from '../../theme';

interface GameReviewContentProps {
  snapshot: GameSnapshot;
  review: GameReview;
  // The side whose moves the review stops at, at the bottom of the board -
  // and the side the viewer played, null if they only watched.
  side: Color;
  viewerColor: Color | null;
  settings: ReviewSettings;
  width: number;
  // Opens the analysis board at a move - the number of moves in.
  onAnalyse: (ply: number) => void;
}

const THEME_ICONS = {
  opening: 'book-open-page-variant',
  tactics: 'target',
  strategy: 'chess-knight',
  endgame: 'chess-king',
} as const;

// What the review's intro is chosen by: how the game went for the side
// reviewed - or that it was only watched - its opening, length and slips.
function introContext(
  snapshot: GameSnapshot,
  review: GameReview,
  side: Color,
  viewerColor: Color | null,
): IntroContext {
  const winner =
    snapshot.result === 'white'
      ? 'w'
      : snapshot.result === 'black'
        ? 'b'
        : null;
  const mine = side === 'w' ? review.white : review.black;
  return {
    outcome:
      viewerColor === null
        ? null
        : winner === null
          ? 'draw'
          : winner === side
            ? 'win'
            : 'loss',
    white: snapshot.white.displayName,
    black: snapshot.black.displayName,
    opponent: (side === 'w' ? snapshot.black : snapshot.white).displayName,
    opening: review.opening?.name ?? null,
    moves: Math.ceil(review.moves.length / 2),
    accuracy: mine.accuracy,
    slips: mine.counts.mistake + mine.counts.miss + mine.counts.blunder,
  };
}

// A finished game, reviewed: its summary - the graph, each side's accuracy
// and classes of move - then its key moments one at a time, each with what
// the review makes of it, read aloud; and to close, what to take from it.
const GameReviewContent: React.FC<GameReviewContentProps> = ({
  snapshot,
  review,
  side,
  viewerColor,
  settings,
  width,
  onAnalyse,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const [retrying, setRetrying] = useState(false);
  const judge = useRetryJudge(retrying);
  const stepper = useReviewStepper(review, side, judge);
  const isRetrying = stepper.mode.kind === 'retry';
  if (isRetrying !== retrying) setRetrying(isRetrying);
  const voice = useReviewVoice(settings.voice, settings.voiceId);
  const themes = useMemo(() => themeCards(review, side), [review, side]);
  const [themeIndex, setThemeIndex] = useState(0);
  const theme = stepper.phase === 'done' ? (themes[themeIndex] ?? null) : null;
  const intro = useMemo(
    () =>
      introLine(
        introContext(snapshot, review, side, viewerColor),
        seedOf(snapshot.id),
      ),
    [snapshot, review, side, viewerColor],
  );

  const view = reviewView({
    review,
    phase: stepper.phase,
    index: stepper.index,
    mode: stepper.mode,
    showLine: stepper.showLine,
    showBestMoves: settings.showBestMoves,
    theme,
    intro,
  });

  // Each new thing said is read aloud, in place of the last - but not the
  // moves played on the way to a key moment, only the moment itself.
  const { say } = voice;
  const quiet = stepper.isPlaying;
  useEffect(() => {
    if (!quiet) say(view.spoken);
  }, [view.spoken, quiet, say]);

  useMoveNavigationSounds(review.moves, stepper.index + 1, false);

  const arrows = useMemo<BoardArrow[]>(
    () =>
      view.arrows.map((arrow) => ({
        from: arrow.from,
        to: arrow.to,
        color:
          arrow.kind === 'best'
            ? colors.board.arrows[0]
            : colors.board.threatArrow,
        weight: 0.15,
      })),
    [view.arrows, colors],
  );
  const moveClasses = useMemo(
    () =>
      Object.fromEntries(
        review.moves.map((move) => [move.ply, move.moveClass]),
      ) as Record<number, MoveClass>,
    [review],
  );
  const players = { white: snapshot.white, black: snapshot.black };
  const atLastMove = stepper.index === review.moves.length - 1;

  if (stepper.phase === 'summary') {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.summary}
        testID="game-review-summary"
      >
        <ReviewBubble text={view.bubble.text} testID="review-intro" />
        <EvalGraph
          scores={review.scores}
          moves={review.moves}
          index={stepper.index}
          onSelect={stepper.goTo}
        />
        {review.opening && (
          <Text style={styles.opening} testID="review-opening">
            {review.opening.name}
          </Text>
        )}
        <ReviewSummary
          white={{ player: players.white, review: review.white }}
          black={{ player: players.black, review: review.black }}
          side={side}
        />
        <Button
          label="Start review"
          onPress={stepper.start}
          testID="review-start"
        />
      </ScrollView>
    );
  }

  const isSlip =
    !!stepper.move &&
    ['inaccuracy', 'mistake', 'miss', 'blunder'].includes(
      stepper.move.moveClass,
    );
  const primary =
    stepper.phase === 'done'
      ? themeIndex < themes.length - 1
        ? { label: 'Next', onPress: () => setThemeIndex((i) => i + 1) }
        : { label: 'Analyse', onPress: () => onAnalyse(stepper.index + 1) }
      : stepper.isPlaying
        ? { label: 'Skip', onPress: stepper.next }
        : stepper.isOffPath
          ? { label: 'Resume', onPress: stepper.next }
          : { label: 'Next', onPress: stepper.next };

  return (
    <View style={styles.screen} testID="game-review-stepping">
      {settings.evalBar && (
        <EvalBar score={view.score} direction="horizontal" orientation={side} />
      )}
      <View style={styles.bubble}>
        <ReviewBubble
          moveClass={view.bubble.moveClass}
          icon={theme ? THEME_ICONS[theme.theme] : undefined}
          title={view.bubble.title ?? undefined}
          score={view.bubble.score}
          text={view.bubble.text}
          line={view.bubble.line}
        />
      </View>
      <ReviewBoard
        fen={view.fen}
        width={width}
        orientation={side}
        lastMove={view.lastMove}
        moveClass={view.moveClass}
        arrows={arrows}
        movableColor={view.movableColor}
        onMove={stepper.tryMove}
        defeated={atLastMove ? defeatedColor(snapshot.result) : null}
      />
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
            moves={review.moves}
            currentPly={stepper.move?.ply ?? 0}
            onSelectPly={(ply) =>
              stepper.goTo(review.moves.findIndex((m) => m.ply === ply))
            }
            moveClasses={moveClasses}
          />
        </View>
        <ToolbarButton
          icon="chevron-right"
          label="Forward"
          onPress={stepper.forward}
          disabled={atLastMove}
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
              onPress={() => {
                setThemeIndex(0);
                stepper.backToSummary();
              }}
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
            onRetry={isSlip ? stepper.retry : undefined}
            showingLine={stepper.showLine}
            onToggleLine={stepper.toggleLine}
            showingBest={stepper.mode.kind === 'best'}
            onToggleBest={stepper.toggleBest}
            canShowBest={!!stepper.move?.bestLine.length}
            primaryLabel={primary.label}
            onPrimary={primary.onPress}
          />
        )}
      </View>
    </View>
  );
};

export default GameReviewContent;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    width: '100%',
    backgroundColor: t.colors.background,
  },
  summary: {
    padding: t.spacing.lg,
    gap: t.spacing.lg,
  },
  opening: {
    fontSize: t.fontSize.md,
    color: t.colors.textMuted,
    textAlign: 'center',
  },
  bubble: {
    minHeight: 112,
    justifyContent: 'flex-end',
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
  },
  moves: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: t.spacing.xs,
  },
  moveList: {
    flex: 1,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
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
