import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import Toast from '../../components/Toast';
import LiveGameSkeleton from '../../components/LiveGameSkeleton';
import { useToast } from '../../hooks/useToast';
import { useGameSession } from '../../hooks/useGameSession';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { useSwipeBackUntilGameLoads } from '../../hooks/useSwipeBackUntilGameLoads';
import { GUEST_GAMES_ARE_RATED } from '../../constants';
import {
  GAME_SNAPSHOT_STATUS,
  useGameSnapshot,
} from '../../hooks/useGameSnapshot';
import { useAuthSession } from '../../context/AuthSessionContext';
import { HomeStackParamList } from '../HomeStack/types';
import { OnlineChessGameProvider } from '../../context/LiveGame/OnlineChessGameContext';
import LiveGameContent from './LiveGameContent';
import SeekingContent from './SeekingContent';

type LiveGameProps = NativeStackScreenProps<HomeStackParamList, 'LiveGame'>;

const LiveGame: React.FC<LiveGameProps> = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const authSession = useAuthSession();
  const isAuthReady = authSession.isReady;
  const socket = isAuthReady ? authSession.socket : null;
  const toast = useToast();
  const { session, startGame, seekNewOpponent } = useGameSession(route.params);
  const isSeeking = session.phase === 'seeking';

  const { isConnecting } = useMatchmaking(
    isSeeking ? session.timeControl : null,
    {
      onMatched: startGame,
      onError: (message) => {
        toast.show(message);
        navigation.goBack();
      },
    },
  );
  const snapshotResult = useGameSnapshot(
    socket,
    session.phase === 'playing' ? session.gameId : null,
  );
  const isGameLoaded =
    session.phase === 'playing' &&
    socket !== null &&
    snapshotResult.status === GAME_SNAPSHOT_STATUS.READY;

  useSwipeBackUntilGameLoads(navigation, isGameLoaded);

  function renderContent() {
    if (session.phase === 'seeking') {
      return (
        <SeekingContent
          width={width}
          timeControl={session.timeControl}
          isConnecting={isConnecting}
          onCancel={() => navigation.goBack()}
        />
      );
    }

    if (!isGameLoaded) {
      return (
        <LiveGameSkeleton
          width={width}
          timeControl={session.timeControl}
          rated={GUEST_GAMES_ARE_RATED}
        />
      );
    }

    const { snapshot } = snapshotResult;
    const myUserId = isAuthReady ? authSession.user.id : '';
    const myColor = snapshot.white.id === myUserId ? 'w' : 'b';

    return (
      <OnlineChessGameProvider
        key={session.gameId}
        socket={socket}
        gameId={session.gameId}
        myColor={myColor}
        snapshot={snapshot}
        onError={(message) => toast.show(message)}
      >
        <LiveGameContent
          width={width}
          navigation={navigation}
          snapshot={snapshot}
          onNewOpponent={seekNewOpponent}
          onError={(message) => toast.show(message)}
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

export default LiveGame;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
});
