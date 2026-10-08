import { Text } from 'react-native';

import { GameResult } from '../../domain/types';

interface GameResultIconProps {
  result: GameResult;
  size?: number;
}

const DEFAULT_SIZE = 16;

const RESULT_GLYPHS: Record<GameResult, { glyph: string; color: string }> = {
  win: { glyph: '✓', color: '#4caf50' }, // check mark
  loss: { glyph: '✕', color: '#e53935' }, // multiplication x
  draw: { glyph: '=', color: '#9e9e9e' },
};

const GameResultIcon: React.FC<GameResultIconProps> = ({
  result,
  size = DEFAULT_SIZE,
}) => {
  const { glyph, color } = RESULT_GLYPHS[result];
  return (
    <Text style={{ fontSize: size, color, fontWeight: '700' }}>{glyph}</Text>
  );
};

export default GameResultIcon;
