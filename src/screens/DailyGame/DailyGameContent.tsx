import { useEffect, useState } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { NUMBER_OF_ROWS } from '../../constants';
import {
  DAILY_SEEK_QUEUED_MESSAGE,
  DEFAULT_RATING_RANGE,
} from '../../constants/seek';
import { daysPerMove, timeControlOf } from '../../constants/timeControls';
import { DAILY_SEEK_FAILED_MESSAGE } from '../../constants/errorMessages';
import { GameBoard } from '../../components/Board';
import MoveList from '../../components/MoveList';
import PromotionMenu from '../../components/PromotionMenu';
import PlayerBarsFrame, {
  SharedPlayerBarProps,
} from '../../components/PlayerBarsFrame';
import GameScreenHeader from '../../components/GameScreenHeader';
import GameToolbar from '../../components/GameToolbar';
import ConfirmMoveBar from '../../components/ConfirmMoveBar';
import BottomBar from '../../components/BottomBar';
import ActionSheet, { ActionSheetAction } from '../../components/ActionSheet';
import ChatSheet from '../../components/ChatSheet';
import DrawOfferPrompt from '../../components/DrawOfferPrompt';
import { useConditionalMoves } from '../../hooks/useConditionalMoves';
import GameOverCard from '../../components/GameOverCard';
import GameOverOverlay from '../../components/GameOverOverlay';
import { useGameClock } from '../../hooks/useGameClock';
import { useBoardOrientation } from '../../hooks/useBoardOrientation';
import { useMoveNavigation } from '../../hooks/useMoveNavigation';
import { useMoveNavigationSounds } from '../../hooks/useGameSounds';
import { nextDailyGame, useDailyGames } from '../../hooks/useDailyGames';
import { useSeekDailyGame } from '../../hooks/useSeekDailyGame';
import { RematchStatus } from '../../hooks/useRematch';
import { useDailyRematch } from '../../hooks/useDailyRematch';
import { usePublishDailyGamePosition } from '../../context/DailyGamePositionsContext';
import { capturedMaterial } from '../../domain/material';
import {
  defeatedColor,
  otherColor,
  playerOf,
  ratingDiffOf,
} from '../../domain/players';
import { GameSnapshot } from '../../network/socketEvents';
import { HomeStackParamList } from '../HomeStack/types';
import { useOnlineChessGameContext } from '../../context/LiveGame/OnlineChessGameContext';
import { DrawOfferStatus } from '../../hooks/useOnlineChessGame';
import { analyseAction, flipBoardAction } from '../gameMenuActions';
import EarlierPositionOverlay from '../LiveGame/EarlierPositionOverlay';

// A daily game's clock counts days and minutes - it needs no more than a
// tick a second.
const DAILY_CLOCK_TICK_MS = 1000;

export type DailyGameContentNavigation = Pick<
  NativeStackNavigationProp<HomeStackParamList, 'DailyGame'>,
  'navigate' | 'replace' | 'goBack' | 'addListener'
>;

interface DailyGameContentProps {
  width: number;
  navigation: DailyGameContentNavigation;
  snapshot: GameSnapshot;
  /** Something to tell the player, or a request that failed. */
  onMessage: (message: string) => void;
}

type DailyGameMenuOptions = {
  isGameOver: boolean;
  canAbort: boolean;
  drawOffer: DrawOfferStatus;
  goToNextGame: () => void;
  offerDraw: () => void;
  acceptDraw: () => void;
  confirmAbort: () => void;
  confirmResign: () => void;
  openSettings: () => void;
  flip: () => void;
  analyse: () => void;
  /** Brings the result card back; only while it's dismissed. */
  showResult?: () => void;
  /** Your conditional moves - how many are saved - offered while the
   * opponent's to move. */
  conditionalMoves?: { count: number; open: () => void };
};

export function dailyGameMenuActions({
  isGameOver,
  canAbort,
  drawOffer,
  goToNextGame,
  offerDraw,
  acceptDraw,
  confirmAbort,
  confirmResign,
  openSettings,
  flip,
  analyse,
  showResult,
  conditionalMoves,
}: DailyGameMenuOptions): ActionSheetAction[] {
  const settings: ActionSheetAction = {
    label: 'Settings',
    onPress: openSettings,
    testID: 'daily-game-settings-action',
  };
  const nextGame: ActionSheetAction = {
    label: 'Next game',
    onPress: goToNextGame,
    testID: 'next-game-action',
  };
  const flipBoard = flipBoardAction(flip);
  if (isGameOver) {
    return [
      nextGame,
      ...(showResult
        ? [
            {
              label: 'Show result',
              onPress: showResult,
              testID: 'show-result-action',
            },
          ]
        : []),
      analyseAction(analyse),
      settings,
      flipBoard,
    ];
  }

  // A draw is offered, like resigning, only once both sides have moved -
  // before that, the game can still be aborted.
  let draw: ActionSheetAction[] = [];
  if (!canAbort && drawOffer === 'none') {
    draw = [
      { label: 'Offer draw', onPress: offerDraw, testID: 'offer-draw-action' },
    ];
  } else if (drawOffer === 'received') {
    draw = [
      {
        label: 'Accept draw',
        onPress: acceptDraw,
        testID: 'accept-draw-action',
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
  const conditional: ActionSheetAction[] = conditionalMoves
    ? [
        {
          label:
            conditionalMoves.count > 0
              ? `Conditional moves (${conditionalMoves.count})`
              : 'Conditional moves',
          onPress: conditionalMoves.open,
          testID: 'conditional-moves-action',
        },
      ]
    : [];
  return [nextGame, ...draw, leaveGame, ...conditional, settings, flipBoard];
}

const DailyGameContent: React.FC<DailyGameContentProps> = ({
  width,
  navigation,
  snapshot,
  onMessage,
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
    moves,
    whiteRatingDiff,
    blackRatingDiff,
    canAbort,
    isOpponentOnline,
    chat,
    resign,
    offerDraw,
    respondToDraw,
    abort,
    hasPendingMove,
    confirmMove,
    cancelMove,
  } = useOnlineChessGameContext();
  const rematch = useDailyRematch({
    opponent: playerOf(snapshot, otherColor(myColor)),
    initialSeconds: snapshot.initialSeconds,
    rated: snapshot.rated,
    myColor,
    onError: onMessage,
  });
  usePublishDailyGamePosition(snapshot.id, {
    white: snapshot.white,
    black: snapshot.black,
    myColor,
    fen,
    moves,
    status: gameStatus,
  });
  const PIECE_WIDTH = width / NUMBER_OF_ROWS;
  const { orientation, flip } = useBoardOrientation(myColor);
  const moveNavigation = useMoveNavigation(moves);
  useMoveNavigationSounds(moves, moveNavigation.currentPly, false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [resultDismissedAt, setResultDismissedAt] =
    useState<RematchStatus | null>(null);
  const isResultDismissed = resultDismissedAt === rematch.status;
  const clock = useGameClock(
    whiteTimeMs,
    blackTimeMs,
    turn,
    !isGameOver,
    DAILY_CLOCK_TICK_MS,
  );

  // The games "Next game" goes through, as Home lists them.
  const { dailyGames, reload: reloadDailyGames } = useDailyGames();
  useEffect(() => {
    reloadDailyGames();
  }, [reloadDailyGames]);
  const nextGame =
    dailyGames.status === 'ready'
      ? nextDailyGame(dailyGames.games, snapshot.id)
      : null;
  const seekDailyGame = useSeekDailyGame();
  const conditional = useConditionalMoves(snapshot.id);
  // Saved on their own screen, over this one.
  const reloadConditional = conditional.reload;
  useEffect(
    () => navigation.addListener('focus', reloadConditional),
    [navigation, reloadConditional],
  );
  const conditionalLines =
    !isGameOver && conditional.saved?.basePly === moves.length
      ? conditional.saved.lines
      : [];

  const timeControl = timeControlOf(snapshot);

  function goToNextGame() {
    if (nextGame) navigation.replace('DailyGame', { gameId: nextGame.id });
    else onMessage('This is your only daily game in progress.');
  }

  // Another daily game of the same days, against someone new.
  async function findNewOpponent() {
    try {
      const outcome = await seekDailyGame({
        days: snapshot.daysPerMove ?? daysPerMove(snapshot),
        rated: snapshot.rated,
        ratingRange: DEFAULT_RATING_RANGE,
        color: 'random',
      });
      if (outcome.status === 'matched') {
        navigation.replace('DailyGame', { gameId: outcome.gameId });
      } else {
        onMessage(DAILY_SEEK_QUEUED_MESSAGE);
      }
    } catch (error) {
      onMessage((error as Error).message || DAILY_SEEK_FAILED_MESSAGE);
    }
  }

  function analyse() {
    navigation.navigate('AnalysisBoard', {
      source: {
        kind: 'game',
        gameId: snapshot.id,
        ply: moveNavigation.currentPly,
      },
    });
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

  const menuActions = dailyGameMenuActions({
    isGameOver,
    canAbort,
    drawOffer,
    goToNextGame,
    offerDraw,
    acceptDraw: () => respondToDraw(true),
    confirmAbort,
    confirmResign,
    openSettings: () => navigation.navigate('DailyGameSettings'),
    flip,
    analyse,
    showResult: isResultDismissed
      ? () => setResultDismissedAt(null)
      : undefined,
    conditionalMoves:
      !isGameOver && turn !== myColor
        ? {
            count: conditionalLines.length,
            open: () =>
              navigation.navigate('ConditionalMoves', { gameId: snapshot.id }),
          }
        : undefined,
  });

  const myPlayer = playerOf(snapshot, myColor);
  const myRatingDiff = ratingDiffOf(
    { whiteRatingDiff, blackRatingDiff },
    myColor,
  );
  const opponentColor = otherColor(myColor);
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
    faded: showsResult,
    onPressPlayer: (player) =>
      navigation.navigate('UserProfile', { username: player.username }),
    daily: true,
  };

  return (
    <View style={styles.screen}>
      <GameScreenHeader
        gameId={snapshot.id}
        timeControl={timeControl}
        rated={snapshot.rated}
        onBack={navigation.goBack}
        onMessage={onMessage}
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
        <GameBoard
          width={width}
          orientation={orientation}
          lastPlayedMove={moves.at(-1) ?? null}
          defeated={defeatedColor(result)}
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
          animate
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
              onAnalyse={analyse}
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
        {/* The toolbar keeps its place while a move waits, hidden under the
            confirm bar, so nothing on the screen moves. */}
        <View style={styles.toolbarSlot}>
          <View
            style={hasPendingMove && styles.hidden}
            pointerEvents={hasPendingMove ? 'none' : 'auto'}
            accessibilityElementsHidden={hasPendingMove}
            importantForAccessibility={
              hasPendingMove ? 'no-hide-descendants' : 'auto'
            }
          >
            <GameToolbar
              onOpenMenu={() => setIsMenuOpen(true)}
              onOpenChat={chat.open}
              unreadChatCount={chat.unreadCount}
              onAnalyse={() =>
                navigation.navigate('DailyAnalysis', { gameId: snapshot.id })
              }
              moveSteps={moveNavigation}
            />
          </View>
          {hasPendingMove && (
            <View style={styles.confirmBar}>
              <ConfirmMoveBar onCancel={cancelMove} onConfirm={confirmMove} />
            </View>
          )}
        </View>
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

export default DailyGameContent;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
  },
  toolbarSlot: {
    width: '100%',
  },
  hidden: {
    opacity: 0,
  },
  confirmBar: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
  },
});
