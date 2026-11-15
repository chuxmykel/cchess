import { Fragment, useEffect, useRef } from 'react';
import {
  ScrollView,
  Text,
  Pressable,
  type ScrollViewInstance,
} from 'react-native';

import MoveClassIcon from '../MoveClassIcon';
import type { MoveClass } from '../../domain/review/types';
import { GameMoveSummary } from '../../network/socketEvents';
import { makeStyles, useTheme } from '../../theme';

/** What the list shows of each move. */
export type MoveListMove = Pick<GameMoveSummary, 'ply' | 'color' | 'san'>;

interface MoveListProps {
  moves: readonly MoveListMove[];
  currentPly: number;
  onSelectPly: (ply: number) => void;
  /** A review's class for each move, by ply: the standouts and slips
   * marked, in their colors. */
  moveClasses?: Partial<Record<number, MoveClass>>;
}

export const MOVE_LIST_HEIGHT = 32;

// The classes worth marking in a list - the rest read as plain moves.
const MARKED_CLASSES: MoveClass[] = [
  'brilliant',
  'great',
  'book',
  'inaccuracy',
  'mistake',
  'miss',
  'blunder',
];

const VISIBLE_WIDTH_BEFORE_CURRENT_MOVE = 48;

function moveNumberOf(ply: number): number {
  return Math.ceil(ply / 2);
}

const MoveList: React.FC<MoveListProps> = ({
  moves,
  currentPly,
  onSelectPly,
  moveClasses,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();

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
        const moveClass = moveClasses?.[move.ply];
        const isMarked = !!moveClass && MARKED_CLASSES.includes(moveClass);
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
              {isMarked && <MoveClassIcon moveClass={moveClass} size={16} />}
              <Text
                style={[
                  styles.san,
                  isCurrent && styles.currentSan,
                  isMarked &&
                    moveClass !== 'book' && {
                      color: colors.moveClass[moveClass],
                    },
                ]}
              >
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
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
