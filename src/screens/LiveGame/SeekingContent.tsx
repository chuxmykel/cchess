import { View, Text, Pressable, StyleSheet } from 'react-native';

import BoardSurface from '../../components/ChessBoard/BoardSurface';
import BottomBar from '../../components/BottomBar';
import GameHeader from '../../components/GameHeader';
import { MOVE_LIST_HEIGHT } from '../../components/MoveList';
import SeekCard from '../../components/SeekCard';
import Icon from '../../components/Icon';
import { BOARD_THEMES } from '../../constants/boardThemes';
import { TimeControl } from '../../constants/timeControls';
import { GUEST_GAMES_ARE_RATED } from '../../constants';

interface SeekingContentProps {
  width: number;
  timeControl: TimeControl;
  isConnecting: boolean;
  onCancel: () => void;
}

const SeekingContent: React.FC<SeekingContentProps> = ({
  width,
  timeControl,
  isConnecting,
  onCancel,
}) => (
  <View style={styles.screen} testID="seeking-content">
    <GameHeader timeControl={timeControl} rated={GUEST_GAMES_ARE_RATED} />
    <View style={styles.moveListSpace} />

    <View style={styles.boardArea}>
      <View style={{ width, height: width }}>
        <BoardSurface colors={BOARD_THEMES.test} />
        <View style={styles.cardOverlay} pointerEvents="box-none">
          <SeekCard
            timeControl={timeControl}
            status={isConnecting ? 'Connecting…' : undefined}
          />
        </View>
      </View>
    </View>

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

export default SeekingContent;

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
    gap: 2,
  },
  cancelLabel: {
    fontSize: 11,
    color: '#555',
  },
});
