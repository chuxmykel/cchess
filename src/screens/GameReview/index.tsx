import { useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Color } from 'chess.js';

import { ReviewBoard } from '../../components/Board';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import ReviewBubble from '../../components/ReviewBubble';
import ReviewProgress from '../../components/ReviewProgress';
import { REVIEW_FACT_MS, ReviewAs } from '../../constants/review';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useReviewSettingsContext } from '../../context/ReviewSettingsContext';
import { colorPlayedBy } from '../../domain/players';
import { ANALYSING_WORDS, seedOf } from '../../domain/review/phrases';
import {
  GameReviewState,
  ReviewUnavailableReason,
  useGameReview,
} from '../../hooks/useGameReview';
import type { GameSnapshot } from '../../network/socketEvents';
import { HomeStackScreenProps } from '../HomeStack/types';
import { plainHeaderItem } from '../plainHeaderOptions';
import { makeStyles } from '../../theme';
import GameReviewContent from './GameReviewContent';

const UNAVAILABLE: Record<ReviewUnavailableReason, string> = {
  'in-play':
    'This game is still being played - it can be reviewed once it ends.',
  aborted: 'This game was aborted, so there is nothing to review.',
  'no-moves': 'No moves were played in this game.',
  'unknown-start':
    "This game began from a position it doesn't record, so it can't be reviewed.",
};

// The side a review stops at: as set - yours, in a game you played, else
// white's.
function reviewedSide(
  reviewAs: ReviewAs,
  snapshot: GameSnapshot,
  userId: string | null,
): Color {
  if (reviewAs === 'white') return 'w';
  if (reviewAs === 'black') return 'b';
  return (userId && colorPlayedBy(snapshot, userId)) || 'w';
}

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

// A finished game's review: worked out on the device the first time - or
// fetched, when someone has already - then stepped through. Its ⚙ opens the
// review's settings.
const GameReview: React.FC<HomeStackScreenProps<'GameReview'>> = ({
  navigation,
  route,
}) => {
  const styles = useStyles();
  const { gameId } = route.params;
  const { width } = useWindowDimensions();
  const session = useAuthSession();
  const userId = session.isReady ? session.user.id : null;
  const { settings } = useReviewSettingsContext();
  const state = useGameReview(gameId, settings.strength);
  // A chess fact to read while the game's analysed, the next every few
  // seconds - the first picked by the game.
  const [factIndex, setFactIndex] = useState(() => seedOf(gameId));
  const analysing = state.status === 'analysing';
  useEffect(() => {
    if (!analysing) return;
    const timer = setInterval(
      () => setFactIndex((index) => index + 1),
      REVIEW_FACT_MS,
    );
    return () => clearInterval(timer);
  }, [analysing]);

  useLayoutEffect(() => {
    navigation.setOptions({
      unstable_headerRightItems: () => [
        plainHeaderItem(
          <Pressable
            onPress={() => navigation.navigate('ReviewSettings')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Review settings"
            testID="review-settings-button"
          >
            <Icon name="cog-outline" size={24} />
          </Pressable>,
        ),
      ],
    });
  }, [navigation]);

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

  const side = reviewedSide(settings.reviewAs, state.snapshot, userId);
  if (state.status === 'analysing') {
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
          fen={state.snapshot.fen}
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

  return (
    <GameReviewContent
      snapshot={state.snapshot}
      review={state.review}
      side={side}
      viewerColor={userId ? colorPlayedBy(state.snapshot, userId) : null}
      settings={settings}
      width={width}
      onAnalyse={(ply) =>
        navigation.navigate('AnalysisBoard', {
          source: { kind: 'game', gameId, ply },
        })
      }
    />
  );
};

export default GameReview;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
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
