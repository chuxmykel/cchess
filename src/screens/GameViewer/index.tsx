import { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import Button from '../../components/Button';
import LiveGameSkeleton from '../../components/LiveGameSkeleton';
import Toast from '../../components/Toast';
import { DEFAULT_RATING_RANGE } from '../../constants/seek';
import { TimeControl } from '../../constants/timeControls';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useGameViewer } from '../../hooks/useGameViewer';
import { useToast } from '../../hooks/useToast';
import { HomeStackParamList } from '../HomeStack/types';
import GameViewerContent from './GameViewerContent';
import ParticipantGameViewer from './ParticipantGameViewer';

type GameViewerProps = NativeStackScreenProps<HomeStackParamList, 'GameViewer'>;

const GameViewer: React.FC<GameViewerProps> = ({ navigation, route }) => {
  const { gameId } = route.params;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const session = useAuthSession();
  const toast = useToast();
  const { state, reload } = useGameViewer(gameId);
  const me = session.isReady ? session.user : null;
  const snapshot = state.status === 'ready' ? state.snapshot : null;
  const myColor =
    snapshot && me
      ? snapshot.white.id === me.id
        ? 'w'
        : snapshot.black.id === me.id
          ? 'b'
          : null
      : null;
  const isMyGameInPlay = myColor !== null && snapshot?.status === 'active';

  useEffect(() => {
    if (isMyGameInPlay) {
      navigation.replace('LiveGame', { gameId });
    }
  }, [isMyGameInPlay, navigation, gameId]);

  function findNewOpponent(timeControl: TimeControl) {
    navigation.navigate('LiveGame', {
      seek: {
        timeControl,
        rated: Boolean(snapshot?.rated && me && !me.isGuest),
        ratingRange: DEFAULT_RATING_RANGE,
      },
    });
  }

  function renderContent() {
    if (state.status === 'error') {
      return (
        <View style={styles.error} testID="game-viewer-error">
          <Text style={styles.errorText}>
            {"This game couldn't be loaded."}
          </Text>
          <Button label="Try again" onPress={reload} variant="outline" />
          <Button label="Back" onPress={navigation.goBack} variant="text" />
        </View>
      );
    }
    if (!snapshot || isMyGameInPlay) {
      return <LiveGameSkeleton width={width} />;
    }
    const contentProps = {
      width,
      snapshot,
      onBack: navigation.goBack,
      onNewOpponent: findNewOpponent,
      onOpenPlayer: (username: string) =>
        navigation.navigate('UserProfile', { username }),
      onError: (message: string) => toast.show(message),
    };
    if (myColor && session.isReady) {
      return (
        <ParticipantGameViewer
          {...contentProps}
          socket={session.socket}
          myUserId={session.user.id}
          myColor={myColor}
        />
      );
    }
    return <GameViewerContent {...contentProps} myColor={null} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {renderContent()}
      <Toast toasts={toast.toasts} />
    </View>
  );
};

export default GameViewer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
  },
});
