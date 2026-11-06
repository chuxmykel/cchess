import { useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Button from '../../components/Button';
import {
  AnalysisSource,
  useAnalysisSource,
} from '../../hooks/useAnalysisSource';
import { ExplorerLine } from '../../hooks/useExplorerLine';
import { HomeStackParamList } from '../HomeStack/types';
import AnalysisBoardContent from './AnalysisBoardContent';
import SetUpPositionView from './SetUpPositionView';
import { makeStyles } from '../../theme';

// The analysis board's route, in the Analysis tab or over a game.
export type AnalysisBoardProps = {
  route: {
    key: string;
    params: { source: AnalysisSource; explorerLine?: ExplorerLine };
  };
  navigation: Pick<
    NativeStackNavigationProp<HomeStackParamList, 'AnalysisBoard'>,
    'setOptions' | 'goBack' | 'navigate' | 'setParams'
  >;
};

// What's being analysed changes in place - a new analysis, or a position set
// up from this one - so the screen has a session: its source, and a key that
// starts the board afresh for each.
type Session = { source: AnalysisSource; key: number };

const AnalysisBoard: React.FC<AnalysisBoardProps> = ({ route, navigation }) => {
  const styles = useStyles();

  const { width } = useWindowDimensions();
  const [session, setSession] = useState<Session>({
    source: route.params.source,
    key: 0,
  });
  // The position editor, opened over the analysis from its menu.
  const [editingFen, setEditingFen] = useState<string | null>(null);
  const { state, reload } = useAnalysisSource(session.source);
  const isSettingUp = session.source.kind === 'setup';

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isSettingUp ? 'Set Up Position' : 'Analysis',
    });
  }, [navigation, isSettingUp]);

  function open(source: AnalysisSource) {
    setEditingFen(null);
    setSession((current) => ({ source, key: current.key + 1 }));
  }
  const analyse = (fen: string) =>
    open({ kind: 'import', startFen: fen, uciMoves: [] });

  if (session.source.kind === 'setup') {
    return (
      <SetUpPositionView
        initialFen={session.source.fen}
        width={width}
        onAnalyse={analyse}
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
  if (state.status === 'in-play') {
    return (
      <View style={styles.centred} testID="analysis-in-play">
        <Text style={styles.message}>
          {
            "This game is still being played. Analyse it from the game's own board."
          }
        </Text>
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
    <>
      <AnalysisBoardContent
        key={session.key}
        start={state.start}
        initialOrientation={state.orientation}
        width={width}
        onNewAnalysis={() => open({ kind: 'new' })}
        onEditPosition={setEditingFen}
        onOpenSettings={() => navigation.navigate('AnalysisSettings')}
        onOpenExplorer={(line, orientation) =>
          navigation.navigate('OpeningExplorer', {
            ...line,
            orientation,
            returnKey: route.key,
          })
        }
        explorerLine={route.params.explorerLine}
        onExplorerLineTaken={() =>
          navigation.setParams({ explorerLine: undefined })
        }
      />
      <Modal
        visible={editingFen !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingFen(null)}
      >
        {editingFen !== null && (
          <SetUpPositionView
            initialFen={editingFen}
            width={width}
            onAnalyse={analyse}
            onCancel={() => setEditingFen(null)}
          />
        )}
      </Modal>
    </>
  );
};

export default AnalysisBoard;

const useStyles = makeStyles((t) => ({
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.md,
    backgroundColor: t.colors.background,
  },
  message: {
    fontSize: t.fontSize.xl,
    color: t.colors.textSecondary,
  },
}));
