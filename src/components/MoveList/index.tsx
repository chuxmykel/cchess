import { Fragment, useEffect, useRef } from 'react';
import {
  ScrollView,
  Text,
  Pressable,
  type ScrollViewInstance,
} from 'react-native';

import { GameMoveSummary } from '../../network/socketEvents';
import { makeStyles } from '../../theme';

/** What the list shows of each move. */
export type MoveListMove = Pick<GameMoveSummary, 'ply' | 'color' | 'san'>;

interface MoveListProps {
  moves: readonly MoveListMove[];
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
  const styles = useStyles();

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

const useStyles = makeStyles((t) => ({
  list: {
    width: '100%',
    flexGrow: 0,
  },
  content: {
    minHeight: MOVE_LIST_HEIGHT,
    alignItems: 'center',
    paddingHorizontal: t.spacing.md,
  },
  moveNumber: {
    fontSize: t.fontSize.lg,
    color: t.colors.textMuted,
    marginLeft: t.spacing.sm,
  },
  move: {
    paddingHorizontal: t.spacing.sm,
    paddingVertical: t.spacing.xs,
    borderRadius: t.radius.xs,
  },
  currentMove: {
    backgroundColor: t.colors.accentSoft,
  },
  san: {
    fontSize: t.fontSize.lg,
    color: t.colors.text,
  },
  currentSan: {
    color: t.colors.accentText,
    fontWeight: t.fontWeight.bold,
  },
}));
