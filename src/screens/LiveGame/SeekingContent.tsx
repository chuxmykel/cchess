import { View, Text, Pressable } from 'react-native';

import { EmptyBoard } from '../../components/Board';
import BottomBar from '../../components/BottomBar';
import GameBoardArea, { PlayerBarSpace } from '../../components/GameBoardArea';
import GameHeader from '../../components/GameHeader';
import { MOVE_LIST_HEIGHT } from '../../components/MoveList';
import SeekCard from '../../components/SeekCard';
import Icon from '../../components/Icon';
import { Seek } from '../../constants/seek';
import { LobbyStats } from '../../network/socketEvents';
import { formatRatingRange } from '../../utils/rating';
import { makeStyles } from '../../theme';

interface SeekingContentProps {
  width: number;
  seek: Seek;
  isRated: boolean;
  myRating: number | null;
  lobbyStats: LobbyStats | null;
  isConnecting: boolean;
  onCancel: () => void;
}

const SeekingContent: React.FC<SeekingContentProps> = ({
  width,
  seek,
  isRated,
  myRating,
  lobbyStats,
  isConnecting,
  onCancel,
}) => {
  const styles = useStyles();
  return (
    <View style={styles.screen} testID="seeking-content">
      <GameHeader timeControl={seek.timeControl} rated={isRated} />
      <View style={styles.moveListSpace} />

      <GameBoardArea>
        <PlayerBarSpace />
        <View style={{ width, height: width }}>
          <EmptyBoard width={width} />
          <View style={styles.cardOverlay} pointerEvents="box-none">
            <SeekCard
              timeControl={seek.timeControl}
              status={isConnecting ? 'Connecting…' : undefined}
              ratingRange={
                myRating === null
                  ? undefined
                  : formatRatingRange(myRating, seek.ratingRange)
              }
              lobbyStats={lobbyStats}
            />
          </View>
        </View>
        <PlayerBarSpace />
      </GameBoardArea>

      <BottomBar>
        <Pressable
          onPress={onCancel}
          style={styles.cancel}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          testID="matchmaking-cancel-button"
        >
          <Icon name="close" size={22} />
          <Text style={styles.cancelLabel}>Cancel</Text>
        </Pressable>
      </BottomBar>
    </View>
  );
};

export default SeekingContent;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    width: '100%',
  },
  moveListSpace: {
    height: MOVE_LIST_HEIGHT,
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: t.spacing.xxs,
  },
  cancelLabel: {
    fontSize: t.fontSize.xs,
    color: t.colors.textSecondary,
  },
}));
