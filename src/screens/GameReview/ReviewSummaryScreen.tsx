import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { ReviewBoard } from '../../components/Board';
import Button from '../../components/Button';
import CchessReviewSummary from '../../components/CchessReviewSummary';
import EvalGraph from '../../components/EvalGraph';
import MomentumRope from '../../components/MomentumRope';
import ReviewBubble from '../../components/ReviewBubble';
import ReviewProgress from '../../components/ReviewProgress';
import ReviewSummary from '../../components/ReviewSummary';
import TimeGraph from '../../components/TimeGraph';
import { REVIEW_FACT_MS } from '../../constants/review';
import { useAuthSession } from '../../context/AuthSessionContext';
import {
  useGameReviewLoad,
  useReviewSessionContext,
} from '../../context/GameReview/GameReviewContext';
import { useReviewSettingsContext } from '../../context/ReviewSettingsContext';
import { ANALYSING_WORDS, seedOf } from '../../domain/review/phrases';
import type {
  GameReviewState,
  ReviewPosition,
  ReviewUnavailableReason,
} from '../../hooks/useGameReview';
import { useMoveNavigationSounds } from '../../hooks/useGameSounds';
import { useMomentumReplay } from '../../hooks/useMomentumReplay';
import { makeStyles } from '../../theme';
import { reviewedSide } from './reviewedSide';
import type { ReviewStackScreenProps } from './types';

const NO_POSITIONS: ReviewPosition[] = [];
const NO_MOVES: { san: string }[] = [];

const UNAVAILABLE: Record<ReviewUnavailableReason, string> = {
  'in-play':
    'This game is still being played - it can be reviewed once it ends.',
  aborted: 'This game was aborted, so there is nothing to review.',
  'no-moves': 'No moves were played in this game.',
  'unknown-start':
    "This game began from a position it doesn't record, so it can't be reviewed.",
};

function progressLabel(
  state: Extract<GameReviewState, { status: 'analysing' }>,
) {
  switch (state.engine.kind) {
    case 'downloading':
      return `Downloading the engine... ${Math.round(state.engine.progress * 100)}%`;
    case 'starting':
      return 'Starting the engine...';
    case 'error':
      return "The engine couldn't start.";
    default:
      return 'Analysing the game...';
  }
}

type Props = ReviewStackScreenProps<'ReviewSummary'>;

// A review's first screen: the game loading, or analysed on the device -
// played through on the board as it's analysed - then the review at a
// glance, Start review pushing the moves over it.
const ReviewSummaryScreen: React.FC<Props> = ({ navigation }) => {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const { state, seed, rememberShownPly } = useGameReviewLoad();
  const session = useReviewSessionContext();
  // The momentum rope's replay, sounding the turning points it passes.
  const turns = useMemo(
    () =>
      (session?.story ?? [])
        .map((chapter) => chapter.turn)
        .filter((turn): turn is number => turn !== null),
    [session?.story],
  );
  const momentum = useMomentumReplay(session?.review.moves ?? NO_MOVES, turns);
  const auth = useAuthSession();
  const userId = auth.isReady ? auth.user.id : null;
  const { settings } = useReviewSettingsContext();

  // A chess fact to read while the game's analysed, the next every few
  // seconds - the first picked by the game.
  const [factIndex, setFactIndex] = useState(() => seedOf(seed));
  const analysing = state.status === 'analysing';
  useEffect(() => {
    if (!analysing) return;
    const timer = setInterval(
      () => setFactIndex((index) => index + 1),
      REVIEW_FACT_MS,
    );
    return () => clearInterval(timer);
  }, [analysing]);

  // The game played through while it's analysed, as far into it as the
  // progress bar is: half way at 50%, its last move at 100%.
  const positions =
    state.status === 'analysing' ? state.positions : NO_POSITIONS;
  const moves = useMemo(
    () => positions.slice(1).map((position) => position.move!),
    [positions],
  );
  const played =
    state.status === 'analysing'
      ? Math.round(state.progress * moves.length)
      : 0;
  useMoveNavigationSounds(moves, played, false);
  useEffect(() => {
    if (analysing) rememberShownPly(played);
  }, [analysing, played, rememberShownPly]);

  if (state.status === 'loading') {
    return (
      <View style={styles.centred} testID="game-review-loading">
        <ActivityIndicator />
      </View>
    );
  }
  if (state.status === 'error') {
    return (
      <View style={styles.centred} testID="game-review-error">
        <Text style={styles.message}>{"This game couldn't be loaded."}</Text>
        <Button label="Try again" onPress={state.retry} variant="outline" />
        <Button label="Back" onPress={navigation.goBack} variant="text" />
      </View>
    );
  }
  if (state.status === 'unavailable') {
    return (
      <View style={styles.centred} testID="game-review-unavailable">
        <Text style={styles.message}>{UNAVAILABLE[state.reason]}</Text>
        <Button label="Back" onPress={navigation.goBack} variant="text" />
      </View>
    );
  }
  if (state.status === 'analysing') {
    const side = reviewedSide(settings.reviewAs, state.game, userId);
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.analysing}
        testID="game-review-analysing"
      >
        <View style={styles.padded}>
          <ReviewBubble
            text={ANALYSING_WORDS[factIndex % ANALYSING_WORDS.length]}
            testID="review-analysing-fact"
          />
        </View>
        <ReviewBoard
          fen={positions[played].fen}
          lastMove={positions[played].move}
          width={width}
          orientation={side}
        />
        <View style={styles.padded}>
          <ReviewProgress
            progress={state.progress}
            label={progressLabel(state)}
            onRetry={
              state.engine.kind === 'error' ? state.engine.retry : undefined
            }
          />
        </View>
      </ScrollView>
    );
  }

  // Ready: the session comes with it.
  if (!session) {
    return (
      <View style={styles.centred} testID="game-review-loading">
        <ActivityIndicator />
      </View>
    );
  }
  const { review, game, side, stepper, view, clock, cchess } = session;
  // Into the moves, at a move - or from the start.
  const openMoves = (index?: number) => {
    if (index === undefined) stepper.start();
    else stepper.goTo(index);
    navigation.navigate('ReviewMoves');
  };

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
          // Following the momentum's replay while it plays.
          index={momentum.at !== null ? momentum.at - 1 : stepper.index}
          onSelect={openMoves}
        />
        {cchess && (
          <MomentumRope
            scores={review.scores}
            at={momentum.at}
            moves={review.moves}
            turns={turns}
            names={session.names}
            isPlaying={momentum.isPlaying}
            onReplay={momentum.play}
            onStop={momentum.stop}
          />
        )}
        {clock && (
          <View style={styles.time} testID="review-time">
            <TimeGraph
              times={clock.times}
              colors={clock.colors}
              side={side}
              index={stepper.index}
              slow={clock.slow}
              hasty={clock.hasty}
              onSelect={openMoves}
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
            names={session.names}
            white={review.white}
            black={review.black}
            side={side}
            decisive={session.decisive}
            story={session.story}
            guesses={session.tally}
            hardest={session.hardest}
            badges={session.badges}
            onSelectMove={openMoves}
            onStartChapter={(i) => openMoves(session.story[i].start)}
          />
        ) : (
          <ReviewSummary
            white={{ player: game.white, review: review.white }}
            black={{ player: game.black, review: review.black }}
            side={side}
          />
        )}
      </ScrollView>
      {/* Pinned under the summary, which can run taller than the screen,
          so it's never scrolled out of reach. */}
      <View style={styles.summaryFooter}>
        <Button
          label="Start review"
          onPress={() => openMoves()}
          testID="review-start"
        />
      </View>
    </View>
  );
};

export default ReviewSummaryScreen;

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
  opening: {
    fontSize: t.fontSize.md,
    color: t.colors.textMuted,
    textAlign: 'center',
  },
  analysing: {
    gap: t.spacing.lg,
    paddingVertical: t.spacing.lg,
  },
  padded: {
    paddingHorizontal: t.spacing.lg,
  },
  centred: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: t.spacing.md,
    padding: t.spacing.xl,
    backgroundColor: t.colors.background,
  },
  message: {
    fontSize: t.fontSize.xl,
    color: t.colors.text,
    textAlign: 'center',
  },
}));
