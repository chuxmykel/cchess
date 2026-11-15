import { Fragment, useEffect, useMemo, useRef } from 'react';
import {
  ScrollView,
  Text,
  Pressable,
  type ScrollViewInstance,
} from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  PanGestureConfig,
  usePanGesture,
} from 'react-native-gesture-handler';

import Icon, { IconName } from '../Icon';
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
  /** Items after the last move - a game review's closing cards - each an
   * icon, the one `selected` set off as the current move is. */
  endItems?: MoveListEndItem[];
  /** Dragging the list steps through the moves instead of scrolling it:
   * called with -1 or 1 for each step's worth of drag - toward the start as
   * the finger moves right, as if pulling the earlier moves into view. */
  onDragStep?: (step: -1 | 1) => void;
}

export type MoveListEndItem = {
  key: string;
  icon: IconName;
  label: string;
  selected: boolean;
  onPress: () => void;
};

// How far a finger drags the list for each move it steps.
export const DRAG_STEP_PX = 28;

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
  endItems,
  onDragStep,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();

  const scrollRef = useRef<ScrollViewInstance>(null);
  const moveXOffsetsByPly = useRef(new Map<number, number>());
  const endItemXOffsets = useRef(new Map<string, number>());
  const selectedEndItem = endItems?.find((item) => item.selected)?.key;

  useEffect(() => {
    const currentX =
      selectedEndItem !== undefined
        ? endItemXOffsets.current.get(selectedEndItem)
        : moveXOffsetsByPly.current.get(currentPly);
    if (currentX !== undefined) {
      scrollRef.current?.scrollTo({
        x: Math.max(0, currentX - VISIBLE_WIDTH_BEFORE_CURRENT_MOVE),
        animated: true,
      });
    }
  }, [currentPly, moves.length, selectedEndItem]);

  // Dragged sideways, the list steps through the moves - with Gesture
  // Handler, which can take a drag from the moves under the finger, as the
  // ScrollView it's in can't. How many steps the drag under way has taken.
  const taken = useRef(0);
  const onDragStepRef = useRef(onDragStep);
  useEffect(() => {
    onDragStepRef.current = onDragStep;
  }, [onDragStep]);
  const dragEnabled = !!onDragStep;
  const dragConfig = useMemo<PanGestureConfig>(
    () => ({
      testID: 'move-list-drag',
      enabled: dragEnabled,
      runOnJS: true,
      // Sideways only: a drag that goes up or down first is left alone.
      activeOffsetX: [-8, 8],
      failOffsetY: [-16, 16],
      onActivate: () => {
        taken.current = 0;
      },
      onUpdate: (event) => {
        // The finger moving left brings later moves in: forward.
        const steps = Math.trunc(-event.translationX / DRAG_STEP_PX);
        while (taken.current !== steps) {
          const step = steps > taken.current ? 1 : -1;
          taken.current += step;
          onDragStepRef.current?.(step);
        }
      },
    }),
    [dragEnabled],
  );
  const drag = usePanGesture(dragConfig);

  const list = (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEnabled={!onDragStep}
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
      {endItems?.map((item) => (
        <Pressable
          key={item.key}
          onPress={item.onPress}
          onLayout={(event) =>
            endItemXOffsets.current.set(item.key, event.nativeEvent.layout.x)
          }
          style={[
            styles.move,
            styles.endItem,
            item.selected && styles.currentMove,
          ]}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: item.selected }}
          testID={`move-list-end-${item.key}`}
        >
          <Icon
            name={item.icon}
            size={18}
            color={item.selected ? colors.accentText : colors.textMuted}
          />
        </Pressable>
      ))}
    </ScrollView>
  );
  if (!onDragStep) return list;
  // With its own root, as the board has, so it works wherever it's drawn.
  return (
    <GestureHandlerRootView style={styles.list}>
      <GestureDetector gesture={drag}>{list}</GestureDetector>
    </GestureHandlerRootView>
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
  endItem: {
    paddingVertical: t.spacing.xs,
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
