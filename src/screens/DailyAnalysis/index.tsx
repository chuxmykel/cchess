import { useMemo } from 'react';
import {
  ActivityIndicator,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import Button from '../../components/Button';
import {
  AnalysisSource,
  useAnalysisSource,
} from '../../hooks/useAnalysisSource';
import { HomeStackParamList } from '../HomeStack/types';
import { makeStyles } from '../../theme';
import DailyAnalysisContent from './DailyAnalysisContent';

type DailyAnalysisProps = NativeStackScreenProps<
  HomeStackParamList,
  'DailyAnalysis'
>;

// A daily game in the analysis board, at the position it's at: its moves to
// look through and lines to try, apart from the game. Reset fetches the game
// again, so the board starts afresh from it as it now stands.
const DailyAnalysis: React.FC<DailyAnalysisProps> = ({ navigation, route }) => {
  const styles = useStyles();
  const { gameId } = route.params;
  const { width } = useWindowDimensions();
  const source = useMemo<AnalysisSource>(
    () => ({ kind: 'game', gameId }),
    [gameId],
  );
  const { state, reload } = useAnalysisSource(source);

  if (state.status === 'error') {
    return (
      <View style={styles.centred} testID="analysis-error">
        <Text style={styles.message}>{"This game couldn't be loaded."}</Text>
        <Button label="Try again" onPress={reload} variant="outline" />
        <Button label="Back" onPress={navigation.goBack} variant="text" />
      </View>
    );
  }
  if (state.status === 'loading') {
    return (
      <View style={styles.centred} testID="analysis-loading">
        <ActivityIndicator />
      </View>
    );
  }
  return (
    <DailyAnalysisContent
      gameId={gameId}
      start={state.start}
      initialOrientation={state.orientation}
      width={width}
      onReset={reload}
    />
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
