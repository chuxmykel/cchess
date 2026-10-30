import { ReactNode } from 'react';
import { View } from 'react-native';
import { Color } from 'chess.js';

import { MaterialImbalance } from '../../domain/material';
import GameBoardArea from '../GameBoardArea';
import PlayerBar, { PlayerBarProps } from '../PlayerBar';

export type SharedPlayerBarProps = Omit<
  PlayerBarProps,
  'color' | 'material' | 'isOnline'
>;

interface PlayerBarsFrameProps {
  /** The side at the bottom. */
  orientation: Color;
  /** What each side has captured. */
  material: MaterialImbalance;
  /** What both bars show alike. */
  playerBarProps: SharedPlayerBarProps;
  /** The online dot, for the sides that show one. */
  isOnline?: Partial<Record<Color, boolean>>;
  /** What goes between the bars - the board, and anything drawn over it,
   * absolutely positioned. */
  children: ReactNode;
  testID?: string;
}

// A game's two player bars, in GameBoardArea, framing what's given between
// them - the board, whichever kind - with the side at the bottom facing it.
const PlayerBarsFrame: React.FC<PlayerBarsFrameProps> = ({
  orientation,
  material,
  playerBarProps,
  isOnline = {},
  children,
  testID,
}) => {
  const topColor: Color = orientation === 'w' ? 'b' : 'w';
  return (
    <GameBoardArea testID={testID}>
      <PlayerBar
        color={topColor}
        isOnline={isOnline[topColor]}
        material={material[topColor]}
        {...playerBarProps}
      />
      <View>{children}</View>
      <PlayerBar
        color={orientation}
        isOnline={isOnline[orientation]}
        material={material[orientation]}
        {...playerBarProps}
      />
    </GameBoardArea>
  );
};

export default PlayerBarsFrame;
