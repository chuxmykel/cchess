import { TimeControl } from '../../constants/timeControls';
import { useGameBookmark } from '../../hooks/useGameBookmark';
import { useGameShare } from '../../hooks/useGameShare';
import { useSendToFriend } from '../../hooks/useSendToFriend';
import FriendPickerSheet from '../FriendPickerSheet';
import GameHeader from '../GameHeader';

interface GameScreenHeaderProps {
  gameId: string;
  timeControl: TimeControl;
  rated: boolean;
  /** A line under the title, such as when the game was played. */
  subtitle?: string;
  onBack?: () => void;
  /** Something to tell the player: that sending or sharing failed, or that
   * the game was sent to a friend. */
  onMessage?: (message: string) => void;
}

// A game's header, with the menu every game has: send it to a friend,
// share it, or bookmark it.
const GameScreenHeader: React.FC<GameScreenHeaderProps> = ({
  gameId,
  onMessage,
  ...headerProps
}) => {
  const shareGame = useGameShare(gameId, onMessage);
  const { isBookmarked, toggleBookmark } = useGameBookmark(gameId, onMessage);
  const sendToFriend = useSendToFriend(onMessage);

  return (
    <>
      <GameHeader
        {...headerProps}
        menuItems={[
          ...(sendToFriend.isAvailable
            ? [
                {
                  label: 'Send to a friend',
                  icon: 'send-outline' as const,
                  onPress: () => sendToFriend.open({ kind: 'game', gameId }),
                  testID: 'send-game-item',
                },
              ]
            : []),
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
      <FriendPickerSheet
        visible={sendToFriend.pending !== null}
        title="Send this game to"
        friends={sendToFriend.friends}
        onPick={sendToFriend.sendTo}
        onClose={sendToFriend.close}
      />
    </>
  );
};

export default GameScreenHeader;
