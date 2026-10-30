import { useState } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Color } from 'chess.js';

import { NUMBER_OF_ROWS } from '../../constants';
import { BOARD_THEMES } from '../../constants/boardThemes';
import {
  animatesMoves,
  timeControlOf,
  TimeControl,
} from '../../constants/timeControls';
import Chessboard from '../../components/ChessBoard';
import MoveList from '../../components/MoveList';
import PromotionMenu from '../../components/PromotionMenu';
import PlayerBarsFrame, {
  SharedPlayerBarProps,
} from '../../components/PlayerBarsFrame';
import GameScreenHeader from '../../components/GameScreenHeader';
import GameToolbar from '../../components/GameToolbar';
import BottomBar from '../../components/BottomBar';
import ActionSheet, { ActionSheetAction } from '../../components/ActionSheet';
import ChatSheet from '../../components/ChatSheet';
import DrawOfferPrompt from '../../components/DrawOfferPrompt';
import GameOverCard from '../../components/GameOverCard';
import GameOverOverlay from '../../components/GameOverOverlay';
import { useGameScreenGestureLock } from '../../hooks/useGameScreenGestureLock';
import { useGameClock } from '../../hooks/useGameClock';
import { useFirstMoveCountdown } from '../../hooks/useFirstMoveCountdown';
import { useBoardOrientation } from '../../hooks/useBoardOrientation';
import { useMoveNavigation } from '../../hooks/useMoveNavigation';
import { useMoveNavigationSounds } from '../../hooks/useGameSounds';
import { capturedMaterial } from '../../domain/material';
import { GameSnapshot } from '../../network/socketEvents';
import { HomeStackParamList } from '../HomeStack/types';
import { useOnlineChessGameContext } from '../../context/LiveGame/OnlineChessGameContext';
import { RematchStatus } from '../../hooks/useRematch';
import EarlierPositionOverlay from './EarlierPositionOverlay';

export type LiveGameContentNavigation = Pick<
  NativeStackNavigationProp<HomeStackParamList, 'LiveGame'>,
  'setOptions' | 'popToTop' | 'navigate'
>;

interface LiveGameContentProps {
  width: number;
  navigation: LiveGameContentNavigation;
  snapshot: GameSnapshot;
  onNewOpponent: (timeControl: TimeControl) => void;
  onError?: (message: string) => void;
}

type GameMenuOptions = {
  isGameOver: boolean;
  canAbort: boolean;
  canOfferDraw: boolean;
  flip: () => void;
  confirmAbort: () => void;
  confirmResign: () => void;
  offerDraw: () => void;
  findNewOpponent: () => void;
  /** Brings the result card back; only while it's dismissed. */
  showResult?: () => void;
};

function gameMenuActions({
  isGameOver,
  canAbort,
  canOfferDraw,
  flip,
  confirmAbort,
  confirmResign,
  offerDraw,
  findNewOpponent,
  showResult,
}: GameMenuOptions): ActionSheetAction[] {
  const flipBoard: ActionSheetAction = {
    label: 'Flip board',
    onPress: flip,
    immediate: true,
    testID: 'flip-board-action',
  };
  if (isGameOver) {
    return [
      flipBoard,
      ...(showResult
        ? [
            {
              label: 'Show result',
              onPress: showResult,
              testID: 'show-result-action',
            },
          ]
        : []),
      {
        label: 'New opponent',
        onPress: findNewOpponent,
        testID: 'new-opponent-action',
      },
    ];
  }
  const leaveGame: ActionSheetAction = canAbort
    ? {
        label: 'Abort game',
        onPress: confirmAbort,
        destructive: true,
        testID: 'abort-game-action',
      }
    : {
        label: 'Resign',
        onPress: confirmResign,
        destructive: true,
        testID: 'resign-action',
      };
  const drawOffer: ActionSheetAction[] = canOfferDraw
    ? [{ label: 'Offer draw', onPress: offerDraw, testID: 'offer-draw-action' }]
    : [];
  return [flipBoard, leaveGame, ...drawOffer];
}

const LiveGameContent: React.FC<LiveGameContentProps> = ({
  width,
  navigation,
  snapshot,
  onNewOpponent,
  onError,
}) => {
  const {
    fen,
    turn,
    pendingPromotion,
    promoteTo,
    cancelPromotion,
    isGameOver,
    gameStatus,
    myColor,
    result,
    resultReason,
    whiteTimeMs,
    blackTimeMs,
    drawOffer,
    firstMoveDeadline,
    moves,
    whiteRatingDiff,
    blackRatingDiff,
    series,
    rematch,
    canAbort,
    isOpponentOnline,
    chat,
    resign,
    offerDraw,
    respondToDraw,
    abort,
  } = useOnlineChessGameContext();
  const PIECE_WIDTH = width / NUMBER_OF_ROWS;
  const { orientation, flip } = useBoardOrientation(myColor);
  const moveNavigation = useMoveNavigation(moves);
  // The live board sounds the game's own moves; this, stepping through them.
  useMoveNavigationSounds(moves, moveNavigation.currentPly, false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // The rematch status the result card was dismissed at: it stays hidden
  // until that changes - when the opponent offers a rematch, say - so a
  // rematch offer is never missed behind a dismissed card.
  const [resultDismissedAt, setResultDismissedAt] =
    useState<RematchStatus | null>(null);
  const isResultDismissed = resultDismissedAt === rematch.status;

  useGameScreenGestureLock(navigation, isGameOver);
  const clock = useGameClock(
    whiteTimeMs,
    blackTimeMs,
    turn,
    !isGameOver && !firstMoveDeadline,
  );
  const firstMoveSecondsLeft = useFirstMoveCountdown(firstMoveDeadline);

  const timeControl = timeControlOf(snapshot);

  function leaveGame() {
    navigation.popToTop();
  }

  function findNewOpponent() {
    onNewOpponent(timeControl);
  }

  function confirmAbort() {
    Alert.alert('Abort game?', 'Are you sure you want to abort?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Abort', style: 'destructive', onPress: abort },
    ]);
  }

  function confirmResign() {
    Alert.alert('Resign?', 'You will lose this game.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Resign', style: 'destructive', onPress: resign },
    ]);
  }

  const menuActions = gameMenuActions({
    isGameOver,
    canAbort,
    // Like resigning, only once both sides have moved - before that, the
    // game can still be aborted.
    canOfferDraw: !canAbort && drawOffer === 'none',
    flip,
    confirmAbort,
    confirmResign,
    offerDraw,
    findNewOpponent,
    showResult: isResultDismissed
      ? () => setResultDismissedAt(null)
      : undefined,
  });

  const myPlayer = myColor === 'w' ? snapshot.white : snapshot.black;
  const myRatingDiff = myColor === 'w' ? whiteRatingDiff : blackRatingDiff;
  const opponentColor: Color = myColor === 'w' ? 'b' : 'w';

  // Every capture up to the position on the board, live or looked back on.
  const material = capturedMaterial(
    moveNavigation.viewedFen ?? fen,
    moves.slice(0, moveNavigation.currentPly),
  );
  const showsResult = isGameOver && moveNavigation.isLive && !isResultDismissed;
  const playerBarProps: SharedPlayerBarProps = {
    white: snapshot.white,
    black: snapshot.black,
    clock,
    turn,
    isGameOver,
    // Dimmed behind the result card, not once it's put away.
    faded: showsResult,
    firstMoveSecondsLeft,
    onPressPlayer: (player) =>
      navigation.navigate('UserProfile', { username: player.username }),
    series,
  };

  return (
    <View style={styles.screen}>
      <GameScreenHeader
        gameId={snapshot.id}
        timeControl={timeControl}
        rated={snapshot.rated}
        onBack={isGameOver ? leaveGame : undefined}
        onError={onError}
      />

      <MoveList
        moves={moves}
        currentPly={moveNavigation.currentPly}
        onSelectPly={moveNavigation.goTo}
      />

      <PlayerBarsFrame
        orientation={orientation}
        material={material}
        playerBarProps={playerBarProps}
        isOnline={{ [opponentColor]: isOpponentOnline }}
        testID="game-board-area"
      >
        <Chessboard
          colors={BOARD_THEMES.test}
          width={width}
          orientation={orientation}
          animate={animatesMoves(snapshot.gameType)}
          lastPlayedMove={moves.at(-1) ?? null}
        />
        {pendingPromotion && moveNavigation.isLive && (
          <PromotionMenu
            promotingColor={turn}
            boardWidth={width}
            pieceWidth={PIECE_WIDTH}
            handlePromotion={promoteTo}
            onCancel={cancelPromotion}
          />
        )}
        <EarlierPositionOverlay
          fen={moveNavigation.viewedFen ?? fen}
          visible={!moveNavigation.isLive}
          width={width}
          orientation={orientation}
          lastMove={moveNavigation.lastMove}
          animate={animatesMoves(snapshot.gameType)}
        />
        {showsResult && (
          <GameOverOverlay
            onDismiss={() => setResultDismissedAt(rematch.status)}
          >
            <GameOverCard
              result={result}
              myColor={myColor}
              resultReason={resultReason}
              myRating={myPlayer.rating}
              myRatingDiff={myRatingDiff}
              onNewOpponent={findNewOpponent}
              // Only a game played out can be rematched, not one aborted.
              rematch={
                gameStatus === 'completed'
                  ? {
                      status: rematch.status,
                      onOffer: rematch.offer,
                      onDecline: rematch.decline,
                    }
                  : undefined
              }
              onDismiss={() => setResultDismissedAt(rematch.status)}
            />
          </GameOverOverlay>
        )}
      </PlayerBarsFrame>

      {!isGameOver && drawOffer === 'received' && (
        <DrawOfferPrompt
          onAccept={() => respondToDraw(true)}
          onDecline={() => respondToDraw(false)}
        />
      )}

      <BottomBar>
        <GameToolbar
          onOpenMenu={() => setIsMenuOpen(true)}
          onResign={confirmResign}
          canResign={!isGameOver && !canAbort}
          onOpenChat={chat.open}
          unreadChatCount={chat.unreadCount}
          moveSteps={moveNavigation}
        />
      </BottomBar>

      <ActionSheet
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        actions={menuActions}
      />

      <ChatSheet chat={chat} players={[snapshot.white, snapshot.black]} />
    </View>
  );
};

export default LiveGameContent;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
  },
});
