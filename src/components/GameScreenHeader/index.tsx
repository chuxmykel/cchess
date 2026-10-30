import { TimeControl } from '../../constants/timeControls';
import { useGameBookmark } from '../../hooks/useGameBookmark';
import { useGameShare } from '../../hooks/useGameShare';
import GameHeader from '../GameHeader';

interface GameScreenHeaderProps {
  gameId: string;
  timeControl: TimeControl;
  rated: boolean;
  /** A line under the title, such as when the game was played. */
  subtitle?: string;
  onBack?: () => void;
  onError?: (message: string) => void;
}

// A game's header, with the menu every game has: share it, or bookmark it.
const GameScreenHeader: React.FC<GameScreenHeaderProps> = ({
  gameId,
  onError,
  ...headerProps
}) => {
  const shareGame = useGameShare(gameId, onError);
  const { isBookmarked, toggleBookmark } = useGameBookmark(gameId, onError);

  return (
    <GameHeader
      {...headerProps}
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
  );
};

export default GameScreenHeader;
