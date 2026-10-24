import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { NUMBER_OF_ROWS } from '../../constants';
import { BOARD_THEMES } from '../../constants/boardThemes';
import Chessboard from '../../components/ChessBoard';
import PromotionMenu from '../../components/PromotionMenu';
import GameClock from '../../components/GameClock';
import GameControls from '../../components/GameControls';
import GameOverBanner from '../../components/GameOverBanner';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { useGameScreenGestureLock } from '../../hooks/useGameScreenGestureLock';
import { useGameClock } from '../../hooks/useGameClock';
import {
  GAME_SNAPSHOT_STATUS,
  useGameSnapshot,
} from '../../hooks/useGameSnapshot';
import { useAuthSession } from '../../context/AuthSessionContext';
import { GameUserSummary } from '../../network/socketEvents';
import { HomeStackParamList } from '../HomeStack/types';
import {
  OnlineChessGameProvider,
  useOnlineChessGameContext,
} from '../../context/LiveGame/OnlineChessGameContext';

type LiveGameProps = NativeStackScreenProps<HomeStackParamList, 'LiveGame'>;

const GameBoard: React.FC<{
  width: number;
  navigation: LiveGameProps['navigation'];
  white: GameUserSummary;
  black: GameUserSummary;
}> = ({ width, navigation, white, black }) => {
  const {
    turn,
    pendingPromotion,
    promoteTo,
    isGameOver,
    myColor,
    result,
    resultReason,
    whiteTimeMs,
    blackTimeMs,
    drawOfferedBy,
    hasAnyMoveBeenMade,
    resign,
    offerDraw,
    respondToDraw,
    abort,
  } = useOnlineChessGameContext();
  const PIECE_WIDTH = width / NUMBER_OF_ROWS;

  useGameScreenGestureLock(navigation, isGameOver);
  const clock = useGameClock(whiteTimeMs, blackTimeMs, turn, !isGameOver);

  function handleDone() {
    navigation.popToTop();
  }

  return (
    <>
      <View style={styles.playerRow}>
        <Text style={styles.playerName}>{black.displayName}</Text>
        <GameClock
          label="Black"
          ms={clock.blackMs}
          isActive={!isGameOver && turn === 'b'}
        />
      </View>

      <Chessboard colors={BOARD_THEMES.test} width={width} />
      {pendingPromotion && (
        <PromotionMenu
          promotingColor={turn}
          boardWidth={width}
          pieceWidth={PIECE_WIDTH}
          handlePromotion={promoteTo}
        />
      )}

      <View style={styles.playerRow}>
        <Text style={styles.playerName}>{white.displayName}</Text>
        <GameClock
          label="White"
          ms={clock.whiteMs}
          isActive={!isGameOver && turn === 'w'}
        />
      </View>

      {!isGameOver && (
        <GameControls
          canAbort={!hasAnyMoveBeenMade}
          drawOfferedByOpponent={
            drawOfferedBy !== null && drawOfferedBy !== myColor
          }
          drawOfferedByMe={drawOfferedBy === myColor}
          onResign={resign}
          onAbort={abort}
          onOfferDraw={offerDraw}
          onAcceptDraw={() => respondToDraw(true)}
          onDeclineDraw={() => respondToDraw(false)}
        />
      )}

      <GameOverBanner
        visible={isGameOver}
        result={result}
        myColor={myColor}
        resultReason={resultReason}
        onDone={handleDone}
      />
    </>
  );
};

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
        <GameBoard
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
  playerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '600',
  },
});
