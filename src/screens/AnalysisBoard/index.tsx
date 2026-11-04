import { useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import Button from '../../components/Button';
import {
  AnalysisSource,
  useAnalysisSource,
} from '../../hooks/useAnalysisSource';
import AnalysisBoardContent from './AnalysisBoardContent';
import SetUpPositionView from './SetUpPositionView';

// The analysis board's route, in the Analysis tab or over a game.
export type AnalysisBoardProps = {
  route: { params: { source: AnalysisSource } };
  navigation: {
    setOptions: (options: { title: string }) => void;
    goBack: () => void;
    navigate: (route: 'AnalysisSettings') => void;
  };
};

// What's being analysed changes in place - a new analysis, or a position set
// up from this one - so the screen has a session: its source, and a key that
// starts the board afresh for each.
type Session = { source: AnalysisSource; key: number };

const AnalysisBoard: React.FC<AnalysisBoardProps> = ({ route, navigation }) => {
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

const styles = StyleSheet.create({
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'white',
  },
  message: {
    fontSize: 16,
    color: '#444',
  },
});
