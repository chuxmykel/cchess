import Icon, { IconName } from '../Icon';
import { GameResult } from '../../domain/types';

interface GameResultIconProps {
  result: GameResult;
  size?: number;
}

const DEFAULT_SIZE = 18;

const RESULT_ICONS: Record<GameResult, { name: IconName; color: string }> = {
  win: { name: 'check', color: '#4caf50' },
  loss: { name: 'close', color: '#e53935' },
  draw: { name: 'equal', color: '#9e9e9e' },
};

const GameResultIcon: React.FC<GameResultIconProps> = ({
  result,
  size = DEFAULT_SIZE,
}) => {
  const { name, color } = RESULT_ICONS[result];
  return (
    <Icon
      name={name}
      size={size}
      color={color}
      testID={`game-result-icon-${result}`}
    />
  );
};

export default GameResultIcon;
