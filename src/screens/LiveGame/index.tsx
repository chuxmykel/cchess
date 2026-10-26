import {
  View,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import {
  GAME_SNAPSHOT_STATUS,
  useGameSnapshot,
} from '../../hooks/useGameSnapshot';
import { useAuthSession } from '../../context/AuthSessionContext';
import { HomeStackParamList } from '../HomeStack/types';
import { OnlineChessGameProvider } from '../../context/LiveGame/OnlineChessGameContext';
import LiveGameContent from './LiveGameContent';

type LiveGameProps = NativeStackScreenProps<HomeStackParamList, 'LiveGame'>;

const LiveGame: React.FC<LiveGameProps> = ({ navigation, route }) => {
  const { gameId } = route.params;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const authSession = useAuthSession();
  const isAuthReady = authSession.isReady;
  const socket = isAuthReady ? authSession.socket : null;
  const snapshotResult = useGameSnapshot(socket, gameId);
  const toast = useToast();

  if (!socket || snapshotResult.status === GAME_SNAPSHOT_STATUS.LOADING) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#769656" />
      </View>
    );
  }

  const { snapshot } = snapshotResult;
  const myUserId = isAuthReady ? authSession.userId : '';
  const myColor = snapshot.white.id === myUserId ? 'w' : 'b';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <OnlineChessGameProvider
        socket={socket}
        gameId={gameId}
        myColor={myColor}
        snapshot={snapshot}
        onError={(message) => toast.show(message)}
      >
        <LiveGameContent
          width={width}
          navigation={navigation}
          white={snapshot.white}
          black={snapshot.black}
        />
      </OnlineChessGameProvider>
      <Toast toasts={toast.toasts} />
    </View>
  );
};

export default LiveGame;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
