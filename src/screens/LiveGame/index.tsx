import { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import Toast from '../../components/Toast';
import LiveGameSkeleton from '../../components/LiveGameSkeleton';
import { useToast } from '../../hooks/useToast';
import { useGameSession } from '../../hooks/useGameSession';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { useLobbyStats } from '../../hooks/useLobbyStats';
import { useSwipeBackUntilGameLoads } from '../../hooks/useSwipeBackUntilGameLoads';
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
  const user =
    isAuthReady && !authSession.user.isGuest ? authSession.user : null;
  const isRatedSeek = user !== null && session.seek?.rated === true;
  const myRating = session.seek
    ? (user?.ratings.find(
        (rating) => rating.category === session.seek.timeControl.type,
      )?.rating ?? null)
    : null;

  // The seek card's rating range is drawn around the account's rating, which
  // a game just played may have changed - "New opponent" seeks again here.
  const isSignedIn = user !== null;
  const { reloadUser } = authSession;
  useEffect(() => {
    if (isSeeking && isSignedIn) reloadUser().catch(() => {});
  }, [isSeeking, isSignedIn, reloadUser]);

  const { isConnecting } = useMatchmaking(isSeeking ? session.seek : null, {
    onMatched: startGame,
    onError: (message) => {
      toast.show(message);
      navigation.goBack();
    },
  });
  const lobbyStats = useLobbyStats(socket, isSeeking);
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
          seek={session.seek}
          isRated={isRatedSeek}
          myRating={myRating}
          lobbyStats={lobbyStats}
          isConnecting={isConnecting}
          onCancel={() => navigation.goBack()}
        />
      );
    }

    if (!isGameLoaded) {
      return (
        <LiveGameSkeleton
          width={width}
          timeControl={session.seek?.timeControl}
          rated={isRatedSeek}
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
