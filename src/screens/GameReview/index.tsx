import { useCallback, useMemo, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuthSession } from '../../context/AuthSessionContext';
import {
  GameReviewLoad,
  GameReviewLoadProvider,
  ReviewSessionProvider,
} from '../../context/GameReview/GameReviewContext';
import { useReviewSettingsContext } from '../../context/ReviewSettingsContext';
import { colorPlayedBy } from '../../domain/players';
import type { AnalysisSource } from '../../hooks/useAnalysisSource';
import {
  GameReviewState,
  ImportedReview,
  importedReviewSeed,
  useGameReview,
  useImportedGameReview,
} from '../../hooks/useGameReview';
import { HomeStackScreenProps } from '../HomeStack/types';
import { plainHeaderOptions, plainHeaderRight } from '../plainHeaderOptions';
import ReviewHeaderButtons from './ReviewHeaderButtons';
import ReviewMovesScreen from './ReviewMovesScreen';
import ReviewSummaryScreen from './ReviewSummaryScreen';
import { reviewedSide } from './reviewedSide';
import type { ReviewStackParamList } from './types';

const ReviewStack = createNativeStackNavigator<ReviewStackParamList>();

type GameReviewProps = HomeStackScreenProps<'GameReview'>;

// A finished game's review: worked out on the device the first time - the
// game played through on the board as it's analysed - or fetched, when
// someone has already; then its summary, and the moves stepped through,
// each a screen of the review's own stack. Its analysis button opens the
// analysis board at the move shown, and its ⚙ the review's settings. The
// game's one played here, or one brought in - a PGN pasted - reviewed
// afresh each time.
const GameReview: React.FC<GameReviewProps> = ({ route }) =>
  'imported' in route.params ? (
    <ImportedGameReview imported={route.params.imported} />
  ) : (
    <PlayedGameReview gameId={route.params.gameId} />
  );

export default GameReview;

function PlayedGameReview({ gameId }: { gameId: string }) {
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
    <GameReviewStack state={state} seed={gameId} analysisAt={analysisAt} />
  );
}

function ImportedGameReview({ imported }: { imported: ImportedReview }) {
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
    <GameReviewStack
      state={state}
      seed={importedReviewSeed(imported)}
      analysisAt={analysisAt}
    />
  );
}

// The review's own stack - its summary, then its moves - over what's shared
// between them: the review as it loads, and once it's ready, the review
// being looked through.
function GameReviewStack({
  state,
  seed,
  analysisAt,
}: Pick<GameReviewLoad, 'seed' | 'analysisAt'> & { state: GameReviewState }) {
  const auth = useAuthSession();
  const userId = auth.isReady ? auth.user.id : null;
  const { settings } = useReviewSettingsContext();
  const shownPly = useRef<number | null>(null);
  const rememberShownPly = useCallback((ply: number) => {
    shownPly.current = ply;
  }, []);
  const load = useMemo(
    () => ({ state, seed, analysisAt, shownPly, rememberShownPly }),
    [state, seed, analysisAt, rememberShownPly],
  );

  const navigator = (
    <ReviewStack.Navigator
      id="GameReview"
      screenOptions={({ navigation }) => ({
        ...plainHeaderOptions(navigation),
        title: 'Game Review',
        ...plainHeaderRight(<ReviewHeaderButtons />),
      })}
    >
      <ReviewStack.Screen
        name="ReviewSummary"
        component={ReviewSummaryScreen}
      />
      <ReviewStack.Screen name="ReviewMoves" component={ReviewMovesScreen} />
    </ReviewStack.Navigator>
  );

  return (
    <GameReviewLoadProvider value={load}>
      {state.status === 'ready' ? (
        <ReviewSessionProvider
          game={state.game}
          review={state.review}
          side={reviewedSide(settings.reviewAs, state.game, userId)}
          viewerColor={userId ? colorPlayedBy(state.game, userId) : null}
          settings={settings}
          onShownPly={rememberShownPly}
        >
          {navigator}
        </ReviewSessionProvider>
      ) : (
        navigator
      )}
    </GameReviewLoadProvider>
  );
}
