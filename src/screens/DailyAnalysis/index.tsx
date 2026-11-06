import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Color } from 'chess.js';

import Button from '../../components/Button';
import { useDailyGamePosition } from '../../context/DailyGamePositionsContext';
import {
  AnalysisSource,
  startOfGame,
  useAnalysisSource,
} from '../../hooks/useAnalysisSource';
import { AnalysisStart } from '../../hooks/useAnalysisTree';
import { GameUserSummary } from '../../network/socketEvents';
import { HomeStackParamList } from '../HomeStack/types';
import { makeStyles } from '../../theme';
import DailyAnalysisContent from './DailyAnalysisContent';

type DailyAnalysisProps = NativeStackScreenProps<
  HomeStackParamList,
  'DailyAnalysis'
>;

// The game an analysis starts from.
type AnalysedGame = {
  start: AnalysisStart;
  orientation: Color;
  isGameInPlay: boolean;
  players: { white: GameUserSummary; black: GameUserSummary };
};

// A daily game in the analysis board, at the position it's at: its moves to
// look through and lines to try, apart from the game. The game comes from
// its screen, open under this one, as it stands - fetched only when it
// isn't - and Reset starts the board afresh from it, the opponent's latest
// move included, with nothing to wait for.
const DailyAnalysis: React.FC<DailyAnalysisProps> = ({ navigation, route }) => {
  const styles = useStyles();
  const { gameId } = route.params;
  const { width } = useWindowDimensions();
  const isFocused = useIsFocused();
  const live = useDailyGamePosition(gameId);
  const source = useMemo<AnalysisSource>(
    () => ({ kind: 'game', gameId }),
    [gameId],
  );
  const { state, reload } = useAnalysisSource(source, {
    allowDailyInPlay: true,
    skip: live !== null,
  });

  const latest = useMemo<AnalysedGame | null>(() => {
    if (live) {
      return {
        start: startOfGame(live),
        orientation: live.myColor,
        isGameInPlay: live.status === 'active',
        players: { white: live.white, black: live.black },
      };
    }
    if (state.status === 'ready' && state.players) {
      return {
        start: state.start,
        orientation: state.orientation,
        isGameInPlay: state.gameStatus === 'active',
        players: state.players,
      };
    }
    return null;
  }, [live, state]);

  // The game as the board started from it - kept while the game moves on,
  // until Reset.
  const [shown, setShown] = useState<{
    game: AnalysedGame;
    resets: number;
  } | null>(null);
  if (shown === null && latest) setShown({ game: latest, resets: 0 });

  function reset() {
    if (latest) {
      setShown((previous) => ({
        game: latest,
        resets: (previous?.resets ?? 0) + 1,
      }));
    }
    // Fetched, not open on its screen: fetched again, for the next reset.
    if (!live) reload();
  }

  if (shown) {
    return (
      <DailyAnalysisContent
        key={shown.resets}
        gameId={gameId}
        start={shown.game.start}
        players={shown.game.players}
        initialOrientation={shown.game.orientation}
        isGameInPlay={shown.game.isGameInPlay}
        width={width}
        onReset={reset}
        onOpenNotes={() => navigation.navigate('GameNotes', { gameId })}
        onOpenExplorer={(line, orientation) =>
          navigation.navigate('OpeningExplorer', {
            ...line,
            orientation,
            returnKey: route.key,
          })
        }
        // Taken once back from the explorer, which sets it as it goes.
        explorerLine={isFocused ? route.params.explorerLine : undefined}
        onExplorerLineTaken={() =>
          navigation.setParams({ explorerLine: undefined })
        }
      />
    );
  }
  if (state.status === 'error') {
    return (
      <View style={styles.centred} testID="analysis-error">
        <Text style={styles.message}>{"This game couldn't be loaded."}</Text>
        <Button label="Try again" onPress={reload} variant="outline" />
        <Button label="Back" onPress={navigation.goBack} variant="text" />
      </View>
    );
  }
  return (
    <View style={styles.centred} testID="analysis-loading">
      <ActivityIndicator />
    </View>
  );
};

export default DailyAnalysis;

const useStyles = makeStyles((t) => ({
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.md,
    backgroundColor: t.colors.background,
  },
  message: {
    color: t.colors.text,
    fontSize: t.fontSize.xl,
  },
}));
