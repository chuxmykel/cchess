import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Color } from 'chess.js';
import { formatDistanceToNowStrict, min } from 'date-fns';

import ActionSheet, { ActionSheetAction } from '../../components/ActionSheet';
import BottomBar from '../../components/BottomBar';
import ChatSheet from '../../components/ChatSheet';
import StaticBoard from '../../components/ChessBoard/StaticBoard';
import GameHeader from '../../components/GameHeader';
import GameOverCard from '../../components/GameOverCard';
import GameOverOverlay from '../../components/GameOverOverlay';
import GameToolbar from '../../components/GameToolbar';
import MoveList from '../../components/MoveList';
import PlayerBar, { PlayerBarProps } from '../../components/PlayerBar';
import GameBoardArea from '../../components/GameBoardArea';
import { BOARD_THEMES } from '../../constants/boardThemes';
import {
  animatesMoves,
  findTimeControl,
  TimeControl,
} from '../../constants/timeControls';
import { capturedMaterial } from '../../domain/material';
import { useBoardOrientation } from '../../hooks/useBoardOrientation';
import { useGameBookmark } from '../../hooks/useGameBookmark';
import { useGameClock } from '../../hooks/useGameClock';
import { UseGameChatResult } from '../../hooks/useGameChat';
import { clocksAtPly } from '../../hooks/useGameViewer';
import { useGameShare } from '../../hooks/useGameShare';
import { useMoveNavigation } from '../../hooks/useMoveNavigation';
import {
  useGameOverSound,
  useMoveNavigationSounds,
} from '../../hooks/useGameSounds';
import { GameSnapshot } from '../../network/socketEvents';

export type ViewerChat = UseGameChatResult & {
  myUserId: string;
  isOpen: boolean;
  isClosed: boolean;
  open: () => void;
  close: () => void;
};

interface GameViewerContentProps {
  width: number;
  snapshot: GameSnapshot;
  /** The viewer's color, or null when they didn't play in the game. */
  myColor: Color | null;
  chat?: ViewerChat;
  onBack: () => void;
  onNewOpponent: (timeControl: TimeControl) => void;
  onOpenPlayer: (username: string) => void;
  onError: (message: string) => void;
}

function whenPlayed(snapshot: GameSnapshot): string {
  if (snapshot.status === 'active') {
    return 'Playing now';
  }
  const playedAt = min([snapshot.endedAt ?? snapshot.createdAt, Date.now()]);
  return formatDistanceToNowStrict(playedAt, { addSuffix: true });
}

const GameViewerContent: React.FC<GameViewerContentProps> = ({
  width,
  snapshot,
  myColor,
  chat,
  onBack,
  onNewOpponent,
  onOpenPlayer,
  onError,
}) => {
  const { orientation, flip } = useBoardOrientation(myColor ?? 'w');
  const moveNavigation = useMoveNavigation(snapshot.moves);
  // Moves arriving in a game being watched sound too, as they're played.
  useMoveNavigationSounds(
    snapshot.moves,
    moveNavigation.currentPly,
    snapshot.status === 'active',
  );
  // And the end of one, as it happens.
  useGameOverSound(snapshot.status !== 'active', snapshot.resultReason);
  const shareGame = useGameShare(snapshot.id, onError);
  const { isBookmarked, toggleBookmark } = useGameBookmark(
    snapshot.id,
    onError,
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isResultDismissed, setIsResultDismissed] = useState(false);

  const isGameOver = snapshot.status !== 'active';
  const liveClock = useGameClock(
    snapshot.whiteTimeRemainingMs,
    snapshot.blackTimeRemainingMs,
    snapshot.turn,
    !isGameOver && !snapshot.firstMoveDeadline,
  );
  const clock =
    !isGameOver && moveNavigation.isLive
      ? liveClock
      : clocksAtPly(snapshot, moveNavigation.currentPly);
  const timeControl = findTimeControl(
    snapshot.initialSeconds,
    snapshot.incrementSeconds,
    snapshot.gameType,
  );
  const viewedFen = moveNavigation.viewedFen ?? snapshot.fen;
  const material = capturedMaterial(
    viewedFen,
    snapshot.moves.slice(0, moveNavigation.currentPly),
  );
  const topColor: Color = orientation === 'w' ? 'b' : 'w';
  const showsResult = isGameOver && moveNavigation.isLive && !isResultDismissed;

  const myPlayer =
    myColor === null ? null : myColor === 'w' ? snapshot.white : snapshot.black;
  const myRatingDiff =
    myColor === 'w'
      ? snapshot.whiteRatingDiff
      : myColor === 'b'
        ? snapshot.blackRatingDiff
        : null;

  // Someone who only watched didn't just play an opponent - offer them a
  // game of their own at the same time control instead.
  const newGameLabel =
    myColor === null ? `Play ${timeControl.label}` : 'New opponent';
  const menuActions: ActionSheetAction[] = [
    {
      label: 'Flip board',
      onPress: flip,
      immediate: true,
      testID: 'flip-board-action',
    },
    {
      label: newGameLabel,
      onPress: () => onNewOpponent(timeControl),
      testID: 'new-opponent-action',
    },
  ];

  const sharedPlayerBarProps: Omit<PlayerBarProps, 'color'> = {
    white: snapshot.white,
    black: snapshot.black,
    clock,
    turn: snapshot.turn,
    isGameOver,
    // Dimmed behind the result card, not once it's put away.
    faded: showsResult,
    onPressPlayer: (player) => onOpenPlayer(player.username),
    series: snapshot.series,
  };

  return (
    <View style={styles.screen} testID="game-viewer">
      <GameHeader
        timeControl={timeControl}
        rated={snapshot.rated}
        subtitle={whenPlayed(snapshot)}
        onBack={onBack}
        menuItems={[
          {
            label: 'Share & export',
            icon: 'export-variant',
            onPress: shareGame,
            testID: 'share-game-item',
          },
          {
            label: isBookmarked ? 'Remove bookmark' : 'Bookmark this game',
            icon: isBookmarked ? 'bookmark' : 'bookmark-outline',
            onPress: toggleBookmark,
            testID: 'bookmark-game-item',
          },
        ]}
      />

      <MoveList
        moves={snapshot.moves}
        currentPly={moveNavigation.currentPly}
        onSelectPly={moveNavigation.goTo}
      />

      <GameBoardArea>
        <PlayerBar
          color={topColor}
          material={material[topColor]}
          {...sharedPlayerBarProps}
        />
        <View>
          <StaticBoard
            fen={viewedFen}
            colors={BOARD_THEMES.test}
            width={width}
            orientation={orientation}
            lastMove={moveNavigation.lastMove}
            animate={animatesMoves(snapshot.gameType)}
          />
          {showsResult && (
            <GameOverOverlay onDismiss={() => setIsResultDismissed(true)}>
              <GameOverCard
                result={snapshot.result}
                myColor={myColor}
                resultReason={snapshot.resultReason}
                myRating={myPlayer?.rating ?? null}
                myRatingDiff={myRatingDiff}
                onNewOpponent={() => onNewOpponent(timeControl)}
                newGameLabel={newGameLabel}
                onDismiss={() => setIsResultDismissed(true)}
              />
            </GameOverOverlay>
          )}
        </View>
        <PlayerBar
          color={orientation}
          material={material[orientation]}
          {...sharedPlayerBarProps}
        />
      </GameBoardArea>

      <BottomBar>
        <GameToolbar
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenChat={chat?.open}
          unreadChatCount={chat?.unreadCount}
          onPreviousMove={moveNavigation.back}
          onNextMove={moveNavigation.forward}
          canGoToPreviousMove={moveNavigation.canGoBack}
          canGoToNextMove={moveNavigation.canGoForward}
        />
      </BottomBar>

      <ActionSheet
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        actions={menuActions}
      />

      {chat && (
        <ChatSheet
          visible={chat.isOpen}
          onClose={chat.close}
          messages={chat.messages}
          myUserId={chat.myUserId}
          playerNames={{
            [snapshot.white.id]: snapshot.white.displayName,
            [snapshot.black.id]: snapshot.black.displayName,
          }}
          onSend={chat.send}
          isClosed={chat.isClosed}
        />
      )}
    </View>
  );
};

export default GameViewerContent;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
  },
});
