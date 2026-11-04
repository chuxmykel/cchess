import { Square } from 'chess.js';

import { BoardArrow } from '../components/ChessBoard/BoardArrows';
import { EngineLineView } from '../hooks/useEngineAnalysis';
import { ThemeColors } from '../theme/themes';

// Each line's weaker than the last, as its color is (colors.board.arrows).
const BEST_WEIGHTS = [0.19, 0.15, 0.15];
const THREAT_WEIGHT = 0.15;

function firstMove(line: EngineLineView | undefined) {
  const uci = line?.pv[0];
  return uci
    ? { from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square }
    : null;
}

// The arrows over an analysis board: each engine line's first move - the
// best one boldest - and what the other side threatens, in red.
export function analysisArrows(
  bestLines: EngineLineView[],
  threatLine: EngineLineView | undefined,
  colors: Pick<ThemeColors['board'], 'arrows' | 'threatArrow'>,
): BoardArrow[] {
  const arrows: BoardArrow[] = [];
  bestLines.forEach((line, index) => {
    const move = firstMove(line);
    if (!move || index >= colors.arrows.length) return;
    arrows.push({
      ...move,
      color: colors.arrows[index],
      weight: BEST_WEIGHTS[index],
    });
  });
  const threat = firstMove(threatLine);
  if (threat) {
    arrows.push({
      ...threat,
      color: colors.threatArrow,
      weight: THREAT_WEIGHT,
    });
  }
  return arrows;
}
