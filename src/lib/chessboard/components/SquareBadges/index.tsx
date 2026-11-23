import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { getXYFromSquare } from '../../coordinates';
import { Color, SquareBadge } from '../../types';

interface SquareBadgesProps {
  badges: SquareBadge[];
  boardWidth: number;
  orientation?: Color;
}

// A badge is this much of a square across, and stands this much of itself
// over the square's top-right corner, as on lichess.
const BADGE_SIZE = 0.42;
const OVERHANG = 0.3;

// Round badges on squares' top-right corners - a mark for the move made
// there. Drawn over the pieces, and never in the way of a touch.
const SquareBadges: React.FC<SquareBadgesProps> = ({
  badges,
  boardWidth,
  orientation = 'w',
}) => {
  if (badges.length === 0) return null;
  const square = boardWidth / 8;
  const size = square * BADGE_SIZE;
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      testID="square-badges"
    >
      {badges.map((badge) => {
        const { x, y } = getXYFromSquare(badge.square, square, orientation);
        // Kept on the board at its right and top edges.
        const left = Math.min(
          x + square - size * (1 - OVERHANG),
          boardWidth - size,
        );
        const top = Math.max(y - size * OVERHANG, 0);
        return (
          <View
            key={badge.square}
            testID={`square-badge-${badge.square}`}
            style={[
              styles.badge,
              {
                left,
                top,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: badge.color,
              },
            ]}
          >
            {badge.content}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

export default memo(SquareBadges);
