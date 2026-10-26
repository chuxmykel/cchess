import { Fragment, useEffect, useRef } from 'react';
import {
  ScrollView,
  Text,
  Pressable,
  StyleSheet,
  type ScrollViewInstance,
} from 'react-native';

import { GameMoveSummary } from '../../network/socketEvents';

interface MoveListProps {
  moves: GameMoveSummary[];
  currentPly: number;
  onSelectPly: (ply: number) => void;
}

export const MOVE_LIST_HEIGHT = 32;

const VISIBLE_WIDTH_BEFORE_CURRENT_MOVE = 48;

function moveNumberOf(ply: number): number {
  return Math.ceil(ply / 2);
}

const MoveList: React.FC<MoveListProps> = ({
  moves,
  currentPly,
  onSelectPly,
}) => {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const moveXOffsetsByPly = useRef(new Map<number, number>());

  useEffect(() => {
    const currentMoveX = moveXOffsetsByPly.current.get(currentPly);
    if (currentMoveX !== undefined) {
      scrollRef.current?.scrollTo({
        x: Math.max(0, currentMoveX - VISIBLE_WIDTH_BEFORE_CURRENT_MOVE),
        animated: true,
      });
    }
  }, [currentPly, moves.length]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.list}
      contentContainerStyle={styles.content}
      testID="move-list"
    >
      {moves.map((move) => {
        const isWhiteMove = move.color === 'w';
        const isCurrent = move.ply === currentPly;
        return (
          <Fragment key={move.ply}>
            {isWhiteMove && (
              <Text style={styles.moveNumber}>{moveNumberOf(move.ply)}.</Text>
            )}
            <Pressable
              onPress={() => onSelectPly(move.ply)}
              onLayout={(event) =>
                moveXOffsetsByPly.current.set(
                  move.ply,
                  event.nativeEvent.layout.x,
                )
              }
              style={[styles.move, isCurrent && styles.currentMove]}
              accessibilityRole="button"
              accessibilityState={{ selected: isCurrent }}
              testID={`move-${move.ply}`}
            >
              <Text style={[styles.san, isCurrent && styles.currentSan]}>
                {move.san}
              </Text>
            </Pressable>
          </Fragment>
        );
      })}
    </ScrollView>
  );
};

export default MoveList;

const styles = StyleSheet.create({
  list: {
    width: '100%',
    flexGrow: 0,
  },
  content: {
    minHeight: MOVE_LIST_HEIGHT,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  moveNumber: {
    fontSize: 15,
    color: '#999',
    marginLeft: 6,
  },
  move: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentMove: {
    backgroundColor: '#e3edd8',
  },
  san: {
    fontSize: 15,
    color: '#333',
  },
  currentSan: {
    color: '#2f6f3e',
    fontWeight: '700',
  },
});
