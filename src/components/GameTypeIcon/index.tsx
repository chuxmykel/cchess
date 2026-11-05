import Icon, { IconName } from '../Icon';
import { GameType } from '../../domain/types';
import { useTheme } from '../../theme';

interface GameTypeIconProps {
  type: GameType;
  size?: number;
}

const DEFAULT_SIZE = 18;

const GAME_TYPE_ICONS: Record<GameType, IconName> = {
  bullet: 'bullet',
  blitz: 'fire',
  rapid: 'clock-fast',
  classical: 'timer-sand',
  daily: 'calendar-clock',
};

const GameTypeIcon: React.FC<GameTypeIconProps> = ({
  type,
  size = DEFAULT_SIZE,
}) => {
  const { colors } = useTheme();
  return (
    <Icon
      name={GAME_TYPE_ICONS[type]}
      size={size}
      color={colors.gameType[type]}
      testID={`game-type-icon-${type}`}
    />
  );
};

export default GameTypeIcon;
