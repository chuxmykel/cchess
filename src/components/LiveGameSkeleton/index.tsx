import { View, StyleSheet } from 'react-native';

import BoardSurface from '../ChessBoard/BoardSurface';
import BottomBar from '../BottomBar';
import GameHeader from '../GameHeader';
import Placeholder from '../Placeholder';
import { MOVE_LIST_HEIGHT } from '../MoveList';
import { PLAYER_BAR_HEIGHT } from '../PlayerBar';
import { BOARD_THEMES } from '../../constants/boardThemes';
import { TimeControl } from '../../constants/timeControls';

interface LiveGameSkeletonProps {
  width: number;
  timeControl?: TimeControl;
  rated?: boolean;
}

const PlayerBarPlaceholder: React.FC = () => (
  <View style={styles.playerBar}>
    <Placeholder width="45%" height={18} />
    <Placeholder width={120} height={30} />
  </View>
);

const LiveGameSkeleton: React.FC<LiveGameSkeletonProps> = ({
  width,
  timeControl,
  rated,
}) => (
  <View style={styles.screen} testID="live-game-skeleton">
    <GameHeader timeControl={timeControl} rated={rated} />
    <View style={styles.moveListSpace} />
    <View style={styles.boardArea}>
      <PlayerBarPlaceholder />
      <View style={{ width, height: width }}>
        <BoardSurface colors={BOARD_THEMES.test} />
      </View>
      <PlayerBarPlaceholder />
    </View>
    <BottomBar />
  </View>
);

export default LiveGameSkeleton;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
  },
  moveListSpace: {
    height: MOVE_LIST_HEIGHT,
  },
  boardArea: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  playerBar: {
    minHeight: PLAYER_BAR_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
});
