import Icon, { IconName } from '../Icon';
import { GAME_TYPE_COLORS } from '../../constants/timeControls';
import { GameType } from '../../domain/types';

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
};

const GameTypeIcon: React.FC<GameTypeIconProps> = ({
  type,
  size = DEFAULT_SIZE,
}) => (
  <Icon
    name={GAME_TYPE_ICONS[type]}
    size={size}
    color={GAME_TYPE_COLORS[type]}
    testID={`game-type-icon-${type}`}
  />
);

export default GameTypeIcon;
