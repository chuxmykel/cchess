import { View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import Icon, { IconName } from '../Icon';
import type { BadgeKind } from '../../domain/review/badges';
import { ThemeColors, useTheme } from '../../theme';

const ICONS: Record<BadgeKind, IconName> = {
  swindle: 'magic-staff',
  comeback: 'trending-up',
  heldDraw: 'shield-half-full',
  clean: 'check-decagram',
  sacrifice: 'chess-knight',
};

export function badgeColor(kind: BadgeKind, colors: ThemeColors): string {
  switch (kind) {
    case 'swindle':
      return colors.warning;
    case 'comeback':
      return colors.success;
    case 'heldDraw':
      return colors.textMuted;
    case 'clean':
      return colors.accent;
    default:
      return colors.moveClass.brilliant;
  }
}

// A badge's mark: a hexagon in its colour, its picture on it.
const BadgeIcon: React.FC<{ kind: BadgeKind; size?: number }> = ({
  kind,
  size = 36,
}) => {
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
      testID={`badge-icon-${kind}`}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Polygon points={points} fill={badgeColor(kind, colors)} />
      </Svg>
      <Icon name={ICONS[kind]} size={size * 0.5} color={colors.textOnAccent} />
    </View>
  );
};

export default BadgeIcon;
