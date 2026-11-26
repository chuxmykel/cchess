import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import Icon from '../Icon';
import type { EngineScore } from '../../domain/evalScore';
import { markOf } from '../../domain/review/marks';
import {
  MOMENTUM_IDLE,
  momentumCaption,
  momentumStanding,
} from '../../domain/review/phrases';
import type { ReviewedMove } from '../../domain/review/types';
import { whiteWinningChances } from '../../domain/review/winChances';
import { makeStyles, useTheme } from '../../theme';

interface MomentumRopeProps {
  // Every position's score, the start first.
  scores: EngineScore[];
  // The position the rope's at while it plays - the game's end otherwise.
  at: number | null;
  // The game's moves, and the indexes of those that turned it.
  moves: Pick<ReviewedMove, 'ply' | 'color' | 'san' | 'moveClass'>[];
  turns: number[];
  names: { w: string; b: string };
  isPlaying: boolean;
  onReplay: () => void;
  onStop: () => void;
}

const KNOT = 18;

// The game as a tug of war: a rope pulled across the midline, its knot
// drawn toward the side that's winning - white's end on the left - and a
// Replay that pulls it through the game, a caption under it naming each
// move, who's ahead after it, and the turning points; Stop puts it back.
const MomentumRope: React.FC<MomentumRopeProps> = ({
  scores,
  at,
  moves,
  turns,
  names,
  isPlaying,
  onReplay,
  onStop,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const score = scores[at ?? scores.length - 1] ?? scores[0];
  // From -1 (black won) to 1 (white won): white's pull moves the knot left.
  const pull = score ? whiteWinningChances(score) : 0;
  const travel = Math.max(0, width - KNOT) / 2;
  const move = at !== null && at > 0 ? moves[at - 1] : null;
  const caption =
    at === null
      ? MOMENTUM_IDLE
      : momentumCaption(
          move && {
            ply: move.ply,
            color: move.color,
            san: move.san,
            glyph: markOf(move.moveClass)?.glyph ?? '',
          },
          momentumStanding(pull, names),
          at > 0 && turns.includes(at - 1),
        );
  const x = useSharedValue(0);
  useEffect(() => {
    x.set(
      withTiming(-pull * travel, {
        duration: isPlaying ? 120 : 300,
        easing: Easing.out(Easing.quad),
      }),
    );
  }, [x, pull, travel, isPlaying]);
  const knotStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
  }));

  return (
    <View style={styles.wrap} testID="momentum-rope">
      <View style={styles.header}>
        <Text style={styles.title}>Momentum</Text>
        <Pressable
          onPress={isPlaying ? onStop : onReplay}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={
            isPlaying ? 'Stop the replay' : 'Replay the momentum'
          }
          style={styles.replay}
          testID="momentum-replay"
        >
          <Icon
            name={isPlaying ? 'stop-circle-outline' : 'play-circle-outline'}
            size={18}
            color={colors.accent}
          />
          <Text style={styles.replayText}>{isPlaying ? 'Stop' : 'Replay'}</Text>
        </Pressable>
      </View>
      <View
        style={styles.track}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        <View style={styles.rope} />
        <View style={styles.midline} />
        <Animated.View
          style={[styles.knot, knotStyle]}
          testID="momentum-knot"
        />
      </View>
      <View style={styles.ends}>
        <Text style={styles.end} numberOfLines={1}>
          {names.w}
        </Text>
        <Text style={[styles.end, styles.endRight]} numberOfLines={1}>
          {names.b}
        </Text>
      </View>
      <Text
        style={[styles.caption, isPlaying && styles.captionPlaying]}
        numberOfLines={2}
        testID="momentum-caption"
      >
        {caption}
      </Text>
    </View>
  );
};

export default MomentumRope;

const useStyles = makeStyles((t) => ({
  wrap: {
    gap: t.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.text,
  },
  replay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xxs,
  },
  replayText: {
    fontSize: t.fontSize.sm,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.accentText,
  },
  caption: {
    // Two lines kept, so the summary doesn't move as it changes.
    minHeight: 2 * 18,
    lineHeight: 18,
    fontSize: t.fontSize.sm,
    color: t.colors.textMuted,
  },
  captionPlaying: {
    color: t.colors.text,
    fontWeight: t.fontWeight.semibold,
  },
  track: {
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rope: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: t.colors.textMuted,
  },
  midline: {
    position: 'absolute',
    width: 2,
    top: 2,
    bottom: 2,
    backgroundColor: t.colors.accent,
  },
  knot: {
    width: KNOT,
    height: KNOT,
    borderRadius: KNOT / 2,
    backgroundColor: t.colors.accent,
    borderWidth: 3,
    borderColor: t.colors.background,
  },
  ends: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  end: {
    flex: 1,
    fontSize: t.fontSize.sm,
    color: t.colors.textMuted,
  },
  endRight: {
    textAlign: 'right',
  },
}));
