import { Fragment, useCallback, useEffect, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  Pressable,
  type ScrollViewInstance,
} from 'react-native';

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
  /** Scrolling the list by hand goes through the moves as it goes: called
   * with the place come to - -1 before the first move, then each move by
   * its index in `moves`, then each end item after them - as each passes
   * the spot the current move is kept at. */
  onScrub?: (position: number) => void;
  /** A hand scroll starting, and ending once the list comes to rest. */
  onScrubbingChange?: (scrubbing: boolean) => void;
}

export type MoveListEndItem = {
  key: string;
  icon: IconName;
  label: string;
  selected: boolean;
  onPress: () => void;
};

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
  onScrub,
  onScrubbingChange,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();

  const scrollRef = useRef<ScrollViewInstance>(null);
  const moveXOffsets = useRef(new Map<number, number>());
  const endItemXOffsets = useRef(new Map<number, number>());
  const selectedEndItem = endItems?.findIndex((item) => item.selected) ?? -1;
  // Scrolled by hand: the list goes where the finger takes it, not to the
  // current move.
  const scrubbing = useRef(false);
  const scrubbedTo = useRef<number | null>(null);

  const scrollToCurrent = useCallback(() => {
    const currentX =
      selectedEndItem >= 0
        ? endItemXOffsets.current.get(selectedEndItem)
        : moveXOffsets.current.get(
            moves.findIndex((move) => move.ply === currentPly),
          );
    if (currentX !== undefined) {
      scrollRef.current?.scrollTo({
        x: Math.max(0, currentX - VISIBLE_WIDTH_BEFORE_CURRENT_MOVE),
        animated: true,
      });
    }
  }, [currentPly, moves, selectedEndItem]);

  useEffect(() => {
    if (!scrubbing.current) scrollToCurrent();
  }, [scrollToCurrent, moves.length]);

  // The place at the spot the current move is kept at: the last item
  // starting before it.
  const placeAt = (x: number): number => {
    const spot = x + VISIBLE_WIDTH_BEFORE_CURRENT_MOVE + 1;
    let place = -1;
    let placeX = -Infinity;
    const consider = (position: number, itemX: number | undefined) => {
      if (itemX !== undefined && itemX <= spot && itemX > placeX) {
        place = position;
        placeX = itemX;
      }
    };
    moves.forEach((_, index) =>
      consider(index, moveXOffsets.current.get(index)),
    );
    endItems?.forEach((_, index) =>
      consider(moves.length + index, endItemXOffsets.current.get(index)),
    );
    return place;
  };

  const startScrub = () => {
    if (!onScrub) return;
    scrubbing.current = true;
    scrubbedTo.current = null;
    onScrubbingChange?.(true);
  };
  const endScrub = () => {
    if (!scrubbing.current) return;
    scrubbing.current = false;
    onScrubbingChange?.(false);
    // Settled on the move now current.
    scrollToCurrent();
  };
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!scrubbing.current || !onScrub) return;
    const place = placeAt(event.nativeEvent.contentOffset.x);
    if (place === scrubbedTo.current) return;
    scrubbedTo.current = place;
    onScrub(place);
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.list}
      contentContainerStyle={styles.content}
      testID="move-list"
      scrollEventThrottle={16}
      onScroll={onScroll}
      onScrollBeginDrag={startScrub}
      onScrollEndDrag={(event) => {
        // Let go still: done; flicked, it's done once it comes to rest.
        if (!event.nativeEvent.velocity?.x) endScrub();
      }}
      onMomentumScrollEnd={endScrub}
    >
      {moves.map((move, index) => {
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
                moveXOffsets.current.set(index, event.nativeEvent.layout.x)
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
      {endItems?.map((item, index) => (
        <Pressable
          key={item.key}
          onPress={item.onPress}
          onLayout={(event) =>
            endItemXOffsets.current.set(index, event.nativeEvent.layout.x)
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
