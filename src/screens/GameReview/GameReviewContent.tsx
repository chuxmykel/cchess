import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Color } from 'chess.js';

import Button from '../../components/Button';
import CchessReviewSummary from '../../components/CchessReviewSummary';
import EvalBar from '../../components/EvalBar';
import EvalGraph from '../../components/EvalGraph';
import { ToolbarButton } from '../../components/GameToolbar';
import { BoardArrow, ReviewBoard } from '../../components/Board';
import MoveList from '../../components/MoveList';
import ReviewBubble from '../../components/ReviewBubble';
import ReviewSummary from '../../components/ReviewSummary';
import ReviewToolbar from '../../components/ReviewToolbar';
import TimeGraph from '../../components/TimeGraph';
import { ReviewSettings } from '../../constants/review';
import { defeatedColor } from '../../domain/players';
import {
  formatSpent,
  guessTally,
  introLine,
  IntroContext,
  type Names,
  seedOf,
  timeLines,
} from '../../domain/review/phrases';
import {
  chapterAt,
  chapters,
  decisiveMoment,
  storyStops,
} from '../../domain/review/story';
import { calledOut, moveTimes, timeReport } from '../../domain/review/time';
import {
  type GameReview,
  isSlip,
  type MoveClass,
  type ThemeCard,
} from '../../domain/review/types';
import { reviewView } from '../../hooks/reviewView';
import {
  useBrilliantSound,
  useMoveNavigationSounds,
  useMoveSounds,
} from '../../hooks/useGameSounds';
import { useRetryJudge } from '../../hooks/useRetryJudge';
import { useReviewStepper } from '../../hooks/useReviewStepper';
import { useReviewVoice } from '../../hooks/useReviewVoice';
import type { ReviewedGame } from '../../hooks/useGameReview';
import { makeStyles, useTheme } from '../../theme';

interface GameReviewContentProps {
  game: ReviewedGame;
  review: GameReview;
  // The side whose moves the review stops at, at the bottom of the board -
  // and the side the viewer played, null if they only watched.
  side: Color;
  viewerColor: Color | null;
  settings: ReviewSettings;
  width: number;
  // Opens the analysis board at a move - the number of moves in.
  onAnalyse: (ply: number) => void;
  // The move shown, as a ply, each time it changes - for the header's analysis button;
  // the game's end on the summary.
  onShownPly: (ply: number) => void;
}

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

// What the review's intro is chosen by: how the game went for the side
// reviewed - or that it was only watched - its opening, length and slips.
function introContext(
  game: ReviewedGame,
  review: GameReview,
  side: Color,
  viewerColor: Color | null,
): IntroContext {
  const winner =
    game.result === 'white' ? 'w' : game.result === 'black' ? 'b' : null;
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
    white: game.white.displayName,
    black: game.black.displayName,
    opponent: (side === 'w' ? game.black : game.white).displayName,
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
  game,
  review,
  side,
  viewerColor,
  settings,
  width,
  onAnalyse,
  onShownPly,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const [retrying, setRetrying] = useState(false);
  // The eval bar and the room above the board, which the bubble fills from
  // the bottom up.
  const [topRoom, setTopRoom] = useState(BUBBLE_ROOM);
  const judge = useRetryJudge(retrying);

  // The cchess style: the game's story - its chapters, the move that
  // decided it, where Next stops and asks for the move - and its clock.
  const cchess = settings.style === 'cchess';
  const names = useMemo<Names>(
    () => ({ w: game.white.displayName, b: game.black.displayName }),
    [game],
  );
  const story = useMemo(
    () => (cchess ? chapters(review, names, game.result) : []),
    [cchess, review, names, game.result],
  );
  const decisive = useMemo(
    () => decisiveMoment(review, names),
    [review, names],
  );
  const clock = useMemo(() => {
    if (!cchess || !game.clock) return null;
    const colors = review.moves.map((move) => move.color);
    const times = moveTimes(game.clock, colors);
    // A clock no move took any time on says nothing.
    if (times.every((ms) => ms === 0)) return null;
    const report = timeReport(review.moves, game.clock, side);
    return {
      times,
      colors,
      report,
      // "Your longest think" to the player reviewed, else by name.
      lines: timeLines(report, viewerColor === side ? null : names[side]),
      ...calledOut(report),
    };
  }, [cchess, game.clock, review, side, viewerColor, names]);
  const stepperOptions = useMemo(() => {
    if (!cchess) return undefined;
    const { stops, guesses } = storyStops(story, review.moves, side);
    const extraCards: ThemeCard[] = [];
    if (clock && clock.lines.length > 0) {
      extraCards.push({
        theme: 'time',
        title: 'Time',
        text: clock.lines.join(' '),
      });
    }
    if (guesses.length > 0) {
      extraCards.push({ theme: 'turns', title: 'Turning points', text: '' });
    }
    return { stops, guesses, extraCards };
  }, [cchess, story, review, side, clock]);
  const stepper = useReviewStepper(review, side, judge, stepperOptions);
  const asked = stepperOptions?.guesses.length ?? 0;
  const answered = Object.values(stepper.guessResults);
  const tally =
    asked > 0 && answered.length > 0
      ? { found: answered.filter((r) => r === 'found').length, asked }
      : null;
  const isGuessing = stepper.mode.kind === 'guess';
  const isRetrying = stepper.mode.kind === 'retry' || isGuessing;
  if (isRetrying !== retrying) setRetrying(isRetrying);
  const voice = useReviewVoice(settings.voice, settings.voiceId);
  // The guesses' card says how they went, as they're made.
  const theme =
    stepper.card?.theme === 'turns'
      ? {
          ...stepper.card,
          text: guessTally(tally?.found ?? 0, asked),
        }
      : stepper.card;
  const lastIndex = review.moves.length - 1;
  // The move on the board: on a closing card, the last.
  const shownIndex = Math.min(stepper.index, lastIndex);
  const intro = useMemo(
    () =>
      introLine(
        introContext(game, review, side, viewerColor),
        seedOf(game.seed),
      ),
    [game, review, side, viewerColor],
  );

  const view = reviewView({
    review,
    phase: stepper.phase,
    index: shownIndex,
    mode: stepper.mode,
    line: stepper.line,
    lineStep: stepper.lineStep,
    showBestMoves: settings.showBestMoves,
    theme,
    intro,
    style: settings.style,
    names,
    // None for a move that took none - a side's first, which starts no
    // clock.
    timeSpent:
      clock && shownIndex >= 0 && clock.times[shownIndex] > 0
        ? formatSpent(clock.times[shownIndex])
        : null,
  });

  // Each new thing said is read aloud, in place of the last - but not the
  // moves played on the way to a key moment, only the moment itself, nor
  // those passed scrolling the move list.
  const { say } = voice;
  const [scrubbing, setScrubbing] = useState(false);
  const quiet = stepper.isPlaying || scrubbing;
  useEffect(() => {
    if (!quiet) say(view.spoken);
  }, [view.spoken, quiet, say]);

  useMoveNavigationSounds(review.moves, shownIndex + 1, false);
  const shownPly =
    stepper.phase === 'summary' ? review.moves.length : shownIndex + 1;
  useEffect(() => {
    onShownPly(shownPly);
  }, [onShownPly, shownPly]);
  // Show's line sounds each of its moves as it's played out.
  const lineMoveSan =
    view.bubble.lineAt !== null
      ? (view.bubble.line?.[view.bubble.lineAt]?.san ?? null)
      : null;
  const lineMove = useMemo(
    () => (lineMoveSan ? { san: lineMoveSan, step: stepper.lineStep } : null),
    [lineMoveSan, stepper.lineStep],
  );
  useMoveSounds(lineMove);
  // A brilliant move gets a sound of its own when the review stops on it.
  const stoppedOnBrilliant =
    stepper.phase !== 'summary' &&
    !stepper.isPlaying &&
    stepper.mode.kind === 'move' &&
    stepper.lineStep === null &&
    view.moveClass === 'brilliant';
  useBrilliantSound(stoppedOnBrilliant ? String(shownIndex) : null);

  const arrows = useMemo<BoardArrow[]>(
    () =>
      view.arrows.map((arrow) => ({
        from: arrow.from,
        to: arrow.to,
        color: colors.board.arrows[0],
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
  const players = { white: game.white, black: game.black };
  const atLastMove = shownIndex === review.moves.length - 1;

  if (stepper.phase === 'summary') {
    return (
      <View style={styles.screen}>
        <ScrollView
          style={styles.summaryScroll}
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
          {clock && (
            <View style={styles.time} testID="review-time">
              <TimeGraph
                times={clock.times}
                colors={clock.colors}
                side={side}
                index={stepper.index}
                slow={clock.slow}
                hasty={clock.hasty}
                onSelect={stepper.goTo}
              />
              {clock.lines.map((line) => (
                <Text key={line} style={styles.timeLine}>
                  {line}
                </Text>
              ))}
            </View>
          )}
          {review.opening && (
            <Text style={styles.opening} testID="review-opening">
              {review.opening.name}
            </Text>
          )}
          {cchess ? (
            <CchessReviewSummary
              moves={review.moves}
              names={names}
              white={review.white}
              black={review.black}
              side={side}
              decisive={decisive}
              story={story}
              guesses={tally}
              onSelectMove={stepper.goTo}
              onStartChapter={(i) => stepper.goTo(story[i].start)}
            />
          ) : (
            <ReviewSummary
              white={{ player: players.white, review: review.white }}
              black={{ player: players.black, review: review.black }}
              side={side}
            />
          )}
        </ScrollView>
        {/* Pinned under the summary, which can run taller than the screen,
            so it's never scrolled out of reach. */}
        <View style={styles.summaryFooter}>
          <Button
            label="Start review"
            onPress={stepper.start}
            testID="review-start"
          />
        </View>
      </View>
    );
  }

  const slipShown = !!stepper.move && isSlip(stepper.move.moveClass);
  // The list stops before the next move it'll ask for - while asking, or
  // on the way there - since showing it, or what followed, would give it
  // away.
  const nextAsked = stepperOptions?.guesses.find(
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
      ? { label: 'Analyse', onPress: () => onAnalyse(shownIndex + 1) }
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
          <>
            <View style={styles.doneBar}>
              <Button
                label="Summary"
                variant="outline"
                onPress={stepper.backToSummary}
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
          </>
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

export default GameReviewContent;

// "Chapter 2 of 4 · Move 14": where the move shown is in the story.
function chapterStripText(
  story: ReturnType<typeof chapters>,
  index: number,
): string {
  const at = Math.max(0, chapterAt(story, Math.max(0, index)));
  return `Chapter ${at + 1} of ${story.length} · ${story[at].title}`;
}

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    width: '100%',
    backgroundColor: t.colors.background,
  },
  summaryScroll: {
    flex: 1,
  },
  summary: {
    padding: t.spacing.lg,
    gap: t.spacing.lg,
  },
  // Start review, a little up from the bottom as the stepping controls are.
  summaryFooter: {
    paddingHorizontal: t.spacing.lg,
    paddingTop: t.spacing.md,
    paddingBottom: t.spacing.xxl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: t.colors.separator,
  },
  time: {
    gap: t.spacing.xs,
  },
  timeLine: {
    fontSize: t.fontSize.md,
    color: t.colors.textSecondary,
  },
  chapterStrip: {
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.accentText,
    textAlign: 'center',
    paddingTop: t.spacing.xs,
  },
  opening: {
    fontSize: t.fontSize.md,
    color: t.colors.textMuted,
    textAlign: 'center',
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
