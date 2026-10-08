import { Text } from 'react-native';

import { GameType } from '../../domain/types';

interface GameTypeIconProps {
  type: GameType;
  size?: number;
}

const DEFAULT_SIZE = 18;

// TODO: swap these placeholder glyphs for real icon assets. Needed: one
// square icon per game type (bullet, blitz, rapid, classical), ~24x24pt,
// transparent background, single color so it can be tinted - SVG
// preferred, otherwise PNG at @1x/@2x/@3x.
const GAME_TYPE_GLYPHS: Record<GameType, string> = {
  bullet: '⚡', // lightning bolt
  blitz: '\u{1F525}', // fire
  rapid: '\u{1F430}', // rabbit
  classical: '♟', // chess pawn
};

const GameTypeIcon: React.FC<GameTypeIconProps> = ({
  type,
  size = DEFAULT_SIZE,
}) => {
  return <Text style={{ fontSize: size }}>{GAME_TYPE_GLYPHS[type]}</Text>;
};

export default GameTypeIcon;
