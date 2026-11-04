import { useCallback, useEffect, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type ScrollViewInstance,
} from 'react-native';

import { MoveListToken } from '../../domain/analysisTree';
import { makeStyles } from '../../theme';

interface VariationMoveListProps {
  tokens: MoveListToken[];
  currentId: string;
  onSelect: (nodeId: string) => void;
  // A long press: the variation's own menu (promote it, delete it).
  onLongPress: (nodeId: string) => void;
}

// An analysis's moves as they read, wrapping like text: the main line, with
// each variation in brackets after the move it's an alternative to, in
// smaller type. The move on the board is marked, and kept in view as it
// changes - stepping through, or a new move at the end.
const VariationMoveList: React.FC<VariationMoveListProps> = ({
  tokens,
  currentId,
  onSelect,
  onLongPress,
}) => {
  const styles = useStyles();

  const scroll = useRef<ScrollViewInstance>(null);
  const isEmpty = tokens.length === 0;

  // Where each move is in the list, and what of the list shows - measured as
  // they're laid out and scrolled, for keeping the current move in view.
  const moves = useRef(new Map<string, { y: number; height: number }>());
  const view = useRef({ offset: 0, height: 0, content: 0 });

  // Scrolls just far enough to show the move, with a little of the list
  // around it; nothing while it's already in view.
  const reveal = useCallback((nodeId: string) => {
    const move = moves.current.get(nodeId);
    const { offset, height, content } = view.current;
    if (!move || height === 0) return;
    const top = move.y - REVEAL_MARGIN;
    const bottom = move.y + move.height + REVEAL_MARGIN;
    const maxOffset = Math.max(0, content - height);
    let to: number | null = null;
    if (top < offset) to = Math.max(0, top);
    else if (bottom > offset + height)
      to = Math.min(maxOffset, bottom - height);
    if (to === null) return;
    view.current.offset = to;
    scroll.current?.scrollTo({ y: to, animated: true });
  }, []);

  // A move stepped to; one just played is revealed once it's laid out.
  useEffect(() => reveal(currentId), [currentId, reveal]);

  return (
    <ScrollView
      ref={scroll}
      style={styles.list}
      contentContainerStyle={styles.content}
      onLayout={(event) => {
        view.current.height = event.nativeEvent.layout.height;
        reveal(currentId);
      }}
      onContentSizeChange={(_, height) => {
        // A move played at the end can be laid out before the list has
        // grown to hold it.
        view.current.content = height;
        reveal(currentId);
      }}
      onScroll={(event) => {
        view.current.offset = event.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
      testID="variation-move-list"
    >
      {isEmpty ? (
        <Text style={styles.empty}>Play a move for either side.</Text>
      ) : (
        <View style={styles.flow}>
          {tokens.map((token, index) => {
            const nested = token.depth > 0;
            if (token.kind !== 'move') {
              return (
                <Text
                  key={`${token.kind}-${index}`}
                  style={[styles.bracket, nested && styles.nested]}
                >
                  {token.kind === 'open' ? '(' : ')'}
                </Text>
              );
            }
            const isCurrent = token.nodeId === currentId;
            return (
              <Pressable
                key={token.nodeId}
                onPress={() => onSelect(token.nodeId)}
                onLongPress={() => onLongPress(token.nodeId)}
                onLayout={(event) => {
                  const { y, height } = event.nativeEvent.layout;
                  // Measured within the moves, which sit in the padding.
                  moves.current.set(token.nodeId, {
                    y: y + LIST_PADDING,
                    height,
                  });
                  if (isCurrent) reveal(token.nodeId);
                }}
                style={[styles.move, isCurrent && styles.current]}
                accessibilityRole="button"
                accessibilityState={{ selected: isCurrent }}
                testID={`analysis-move-${token.nodeId}`}
              >
                <Text
                  style={[
                    styles.san,
                    nested && styles.nested,
                    isCurrent && styles.currentText,
                  ]}
                >
                  {token.label && (
                    <Text
                      style={[styles.number, isCurrent && styles.currentNumber]}
                    >{`${token.label} `}</Text>
                  )}
                  {token.san}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

export default VariationMoveList;

const LIST_PADDING = 12;
// How much of the list to show beyond a move scrolled to - about a row.
const REVEAL_MARGIN = 24;

const useStyles = makeStyles((t) => ({
  list: {
    flex: 1,
  },
  content: {
    padding: LIST_PADDING,
  },
  flow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  move: {
    paddingHorizontal: t.spacing.xs,
    paddingVertical: t.spacing.xs,
    borderRadius: t.radius.xs,
  },
  current: {
    backgroundColor: t.colors.accent,
  },
  san: {
    fontSize: t.fontSize.lg,
    color: t.colors.text,
  },
  currentText: {
    color: t.colors.textOnAccent,
    fontWeight: t.fontWeight.semibold,
  },
  // Lighter than the moves, so they stand out from them.
  number: {
    color: t.colors.textMuted,
  },
  currentNumber: {
    color: t.colors.textOnAccentMuted,
  },
  nested: {
    fontSize: t.fontSize.md,
    color: t.colors.textSecondary,
  },
  bracket: {
    fontSize: t.fontSize.lg,
    color: t.colors.textMuted,
    paddingHorizontal: 1,
  },
  empty: {
    fontSize: t.fontSize.base,
    color: t.colors.textMuted,
    textAlign: 'center',
    marginTop: t.spacing.sm,
  },
}));
