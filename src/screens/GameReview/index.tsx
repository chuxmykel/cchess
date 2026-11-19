import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
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
import { useMoveNavigationSounds } from '../../hooks/useGameSounds';
import type { AnalysisSource } from '../../hooks/useAnalysisSource';
import {
  GameReviewState,
  ImportedReview,
  importedReviewSeed,
  ReviewedGame,
  ReviewPosition,
  ReviewUnavailableReason,
  useGameReview,
  useImportedGameReview,
} from '../../hooks/useGameReview';
import { HomeStackScreenProps } from '../HomeStack/types';
import { plainHeaderRight } from '../plainHeaderOptions';
import { makeStyles } from '../../theme';
import GameReviewContent from './GameReviewContent';

const NO_POSITIONS: ReviewPosition[] = [];

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
  game: ReviewedGame,
  userId: string | null,
): Color {
  if (reviewAs === 'white') return 'w';
  if (reviewAs === 'black') return 'b';
  return (userId && colorPlayedBy(game, userId)) || 'w';
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

type GameReviewProps = HomeStackScreenProps<'GameReview'>;

// A finished game's review: worked out on the device the first time - the
// game played through on the board as it's analysed - or fetched, when
// someone has already; then stepped through. Its analysis button opens the analysis
// board at the move shown, and its ⚙ the review's settings. The game's one
// played here, or one brought in - a PGN pasted - reviewed afresh each time.
const GameReview: React.FC<GameReviewProps> = ({ navigation, route }) =>
  'imported' in route.params ? (
    <ImportedGameReview
      navigation={navigation}
      imported={route.params.imported}
    />
  ) : (
    <PlayedGameReview navigation={navigation} gameId={route.params.gameId} />
  );

export default GameReview;

type Navigation = GameReviewProps['navigation'];

function PlayedGameReview({
  navigation,
  gameId,
}: {
  navigation: Navigation;
  gameId: string;
}) {
  const { settings } = useReviewSettingsContext();
  const state = useGameReview(gameId, settings.strength);
  const analysisAt = useCallback(
    (ply?: number): AnalysisSource => ({
      kind: 'game',
      gameId,
      ...(ply !== undefined && { ply }),
    }),
    [gameId],
  );
  return (
    <GameReviewView
      navigation={navigation}
      state={state}
      seed={gameId}
      analysisAt={analysisAt}
    />
  );
}

function ImportedGameReview({
  navigation,
  imported,
}: {
  navigation: Navigation;
  imported: ImportedReview;
}) {
  const { settings } = useReviewSettingsContext();
  const state = useImportedGameReview(imported, settings.strength);
  const analysisAt = useCallback(
    (ply?: number): AnalysisSource => ({
      kind: 'import',
      ...imported,
      ...(ply !== undefined && { ply }),
    }),
    [imported],
  );
  return (
    <GameReviewView
      navigation={navigation}
      state={state}
      seed={importedReviewSeed(imported)}
      analysisAt={analysisAt}
    />
  );
}

function GameReviewView({
  navigation,
  state,
  seed,
  analysisAt,
}: {
  navigation: Navigation;
  state: GameReviewState;
  // What the facts shown while it's analysed are picked by.
  seed: string;
  // The analysis board's source at a move - the game's end, left out.
  analysisAt: (ply?: number) => AnalysisSource;
}) {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const session = useAuthSession();
  const userId = session.isReady ? session.user.id : null;
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
      ...plainHeaderRight(
        <View style={styles.headerButtons}>
          <Pressable
            onPress={() =>
              navigation.navigate('AnalysisBoard', {
                source: analysisAt(shownPly.current ?? undefined),
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
    });
  }, [navigation, analysisAt, styles]);

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

  const side = reviewedSide(settings.reviewAs, state.game, userId);
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

  return (
    <GameReviewContent
      game={state.game}
      review={state.review}
      side={side}
      viewerColor={userId ? colorPlayedBy(state.game, userId) : null}
      settings={settings}
      width={width}
      onShownPly={rememberShownPly}
      onAnalyse={(ply) =>
        navigation.navigate('AnalysisBoard', { source: analysisAt(ply) })
      }
    />
  );
}

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
