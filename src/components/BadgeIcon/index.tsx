import { View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import Icon, { IconName } from '../Icon';
import {
  type Badge,
  BADGE_GROUPS,
  type GameBadgeKind,
} from '../../domain/badges';
import { ThemeColors, useTheme } from '../../theme';

const ICONS: Record<GameBadgeKind, IconName> = {
  swindle: 'magic-staff',
  comeback: 'trending-up',
  heldDraw: 'shield-half-full',
  neverInDoubt: 'shield-check',
  rollercoaster: 'sine-wave',
  endgameGrind: 'chess-king',
  fortress: 'castle',
  miniature: 'flash',
  marathon: 'run-fast',
  brilliancy: 'star-four-points',
  sacrifice: 'chess-knight',
  queenSacrifice: 'chess-queen',
  forkFrenzy: 'source-fork',
  underpromotion: 'chevron-triple-up',
  smotheredMate: 'cube',
  backRankMate: 'wall',
  pawnMate: 'chess-pawn',
  kingsMarch: 'crown',
  clean: 'check-decagram',
  flawless: 'diamond-stone',
  bookWorm: 'book-open-page-variant',
  photoFinish: 'flag-checkered',
  deepThinker: 'head-lightbulb',
  lightningPrecision: 'lightning-bolt',
  giantKiller: 'sword',
};

// Each group of badges in a colour of its own.
const GROUP_OF: Record<GameBadgeKind, number> = Object.fromEntries(
  BADGE_GROUPS.flatMap((group, index) =>
    group.kinds.map((kind) => [kind, index]),
  ),
) as Record<GameBadgeKind, number>;

export function badgeColor(kind: GameBadgeKind, colors: ThemeColors): string {
  return [
    colors.success,
    colors.moveClass.brilliant,
    colors.danger,
    colors.accent,
    colors.warning,
    colors.moveClass.great,
  ][GROUP_OF[kind]];
}

// A badge's mark: a hexagon in its colour, a picture on it.
export const BadgeHexagon: React.FC<{
  icon: IconName;
  color: string;
  size?: number;
  testID?: string;
}> = ({ icon, color, size = 36, testID }) => {
  const { colors } = useTheme();
  const r = size / 2;
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return `${r + r * Math.cos(angle)},${r + r * Math.sin(angle)}`;
  }).join(' ');
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      testID={testID}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Polygon points={points} fill={color} />
      </Svg>
      <Icon name={icon} size={size * 0.5} color={colors.textOnAccent} />
    </View>
  );
};

const BadgeIcon: React.FC<{ kind: GameBadgeKind; size?: number }> = ({
  kind,
  size = 36,
}) => {
  const { colors } = useTheme();
  return (
    <BadgeHexagon
      icon={ICONS[kind]}
      color={badgeColor(kind, colors)}
      size={size}
      testID={`badge-icon-${kind}`}
    />
  );
};

// Any badge's mark: a game badge's own, or a milestone's - a trophy for
// games played, steps up for a rating, in its game type's colour.
export const BadgeMark: React.FC<{
  badge: Pick<Badge, 'kind' | 'category'>;
  size?: number;
}> = ({ badge, size = 36 }) => {
  const { colors } = useTheme();
  if (badge.kind === 'gamesPlayed') {
    return <BadgeHexagon icon="trophy" color={colors.warning} size={size} />;
  }
  if (badge.kind === 'ratingReached') {
    return (
      <BadgeHexagon
        icon="stairs-up"
        color={badge.category ? colors.gameType[badge.category] : colors.accent}
        size={size}
      />
    );
  }
  return <BadgeIcon kind={badge.kind} size={size} />;
};

export default BadgeIcon;
