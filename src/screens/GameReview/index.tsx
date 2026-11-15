import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Color, DEFAULT_POSITION, Square } from 'chess.js';

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
import { useMoveNavigationSounds } from '../../hooks/useGameSounds';
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

const NO_MOVES: GameSnapshot['moves'] = [];

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

// A finished game's review: worked out on the device the first time - the
// game played through on the board as it's analysed - or fetched, when
// someone has already; then stepped through. Its analysis button opens the analysis
// board at the move shown, and its ⚙ the review's settings.
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

  // The game played through while it's analysed, as far into it as the
  // progress bar is: half way at 50%, its last move at 100%.
  const moves = state.status === 'analysing' ? state.snapshot.moves : NO_MOVES;
  const played =
    state.status === 'analysing'
      ? Math.round(state.progress * moves.length)
      : 0;
  useMoveNavigationSounds(moves, played, false);

  // The move shown, as a ply - where the analysis board opens. Read only
  // when the analysis button's pressed.
  const shownPly = useRef<number | null>(null);
  useEffect(() => {
    if (analysing) shownPly.current = played;
  }, [analysing, played]);
  const rememberShownPly = useCallback((ply: number) => {
    shownPly.current = ply;
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      // One item, so the two sit close together rather than spaced as
      // separate header buttons are.
      unstable_headerRightItems: () => [
        plainHeaderItem(
          <View style={styles.headerButtons}>
            <Pressable
              onPress={() =>
                navigation.navigate('AnalysisBoard', {
                  source: {
                    kind: 'game',
                    gameId,
                    ...(shownPly.current !== null && { ply: shownPly.current }),
                  },
                })
              }
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Analyse"
              testID="review-analyse-button"
            >
              <Icon name="head-cog-outline" size={24} />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('ReviewSettings')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Review settings"
              testID="review-settings-button"
            >
              <Icon name="cog-outline" size={24} />
            </Pressable>
          </View>,
        ),
      ],
    });
  }, [navigation, gameId, styles]);

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
          fen={played > 0 ? moves[played - 1].fenAfter : DEFAULT_POSITION}
          lastMove={
            played > 0
              ? {
                  from: moves[played - 1].from as Square,
                  to: moves[played - 1].to as Square,
                }
              : null
          }
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
      onShownPly={rememberShownPly}
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.lg,
  },
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
