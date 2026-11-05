import Icon, { IconName } from '../Icon';
import { GameResult } from '../../domain/types';
import { ThemeColors, useTheme } from '../../theme';

interface GameResultIconProps {
  result: GameResult;
  size?: number;
}

const DEFAULT_SIZE = 18;

const RESULT_ICONS: Record<
  GameResult,
  { name: IconName; color: (colors: ThemeColors) => string }
> = {
  win: { name: 'check', color: (colors) => colors.success },
  loss: { name: 'close', color: (colors) => colors.danger },
  draw: { name: 'equal', color: (colors) => colors.textMuted },
};

const GameResultIcon: React.FC<GameResultIconProps> = ({
  result,
  size = DEFAULT_SIZE,
}) => {
  const { colors } = useTheme();
  const { name, color } = RESULT_ICONS[result];
  return (
    <Icon
      name={name}
      size={size}
      color={color(colors)}
      testID={`game-result-icon-${result}`}
    />
  );
};

export default GameResultIcon;
