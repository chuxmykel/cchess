import { useCallback, useState } from 'react';
import { Color } from 'chess.js';

import { otherColor } from '../domain/players';

export type BoardOrientation = {
  orientation: Color;
  isFlipped: boolean;
  flip: () => void;
};

// Which side of the board is shown at the bottom: the player's own color by
// default, toggled to the opponent's view by `flip`. Purely a viewing
// preference - it never affects whose turn it is or which pieces can move.
export function useBoardOrientation(myColor: Color): BoardOrientation {
  const [isFlipped, setIsFlipped] = useState(false);

  const flip = useCallback(() => {
    setIsFlipped((previous) => !previous);
  }, []);

  return {
    orientation: isFlipped ? otherColor(myColor) : myColor,
    isFlipped,
    flip,
  };
}
