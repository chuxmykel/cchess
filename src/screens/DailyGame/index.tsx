import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import Toast from '../../components/Toast';
import LiveGameSkeleton from '../../components/LiveGameSkeleton';
import { useToast } from '../../hooks/useToast';
import {
  GAME_SNAPSHOT_STATUS,
  useGameSnapshot,
} from '../../hooks/useGameSnapshot';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useDailyGameSettingsContext } from '../../context/DailyGameSettingsContext';
import { OnlineChessGameProvider } from '../../context/LiveGame/OnlineChessGameContext';
import { colorPlayedBy } from '../../domain/players';
import { HomeStackParamList } from '../HomeStack/types';
import DailyGameContent from './DailyGameContent';

type DailyGameProps = NativeStackScreenProps<HomeStackParamList, 'DailyGame'>;

// One of your daily games, to play a move in whenever you like: unlike a
// live game, it's left and come back to - Back and swipe-back always work.
const DailyGame: React.FC<DailyGameProps> = ({ navigation, route }) => {
  const { gameId } = route.params;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const authSession = useAuthSession();
  const socket = authSession.isReady ? authSession.socket : null;
  const toast = useToast();
  const snapshotResult = useGameSnapshot(socket, gameId);
  const { settings } = useDailyGameSettingsContext();

  function renderContent() {
    if (
      !socket ||
      !authSession.isReady ||
      snapshotResult.status !== GAME_SNAPSHOT_STATUS.READY ||
      snapshotResult.snapshot.id !== gameId
    ) {
      return <LiveGameSkeleton width={width} />;
    }
    const { snapshot } = snapshotResult;
    const myColor = colorPlayedBy(snapshot, authSession.user.id) ?? 'w';

    return (
      <OnlineChessGameProvider
        key={gameId}
        socket={socket}
        gameId={gameId}
        myColor={myColor}
        snapshot={snapshot}
        onError={(message) => toast.show(message)}
        options={{ confirmMoves: settings.confirmMoves }}
      >
        <DailyGameContent
          width={width}
          navigation={navigation}
          snapshot={snapshot}
          onMessage={(message) => toast.show(message)}
        />
      </OnlineChessGameProvider>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {renderContent()}
      <Toast toasts={toast.toasts} />
    </View>
  );
};

export default DailyGame;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
});
