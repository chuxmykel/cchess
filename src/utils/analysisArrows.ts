import { Square } from 'chess.js';

import { BoardArrow } from '../components/ChessBoard/BoardArrows';
import { EngineLineView } from '../hooks/useEngineAnalysis';

// Soft enough to see the pieces under them; each line's weaker than the last.
const BEST_COLOURS = [
  'rgba(98, 153, 88, 0.62)',
  'rgba(98, 153, 88, 0.42)',
  'rgba(98, 153, 88, 0.3)',
];
const BEST_WEIGHTS = [0.19, 0.15, 0.15];
const THREAT_COLOUR = 'rgba(214, 96, 86, 0.58)';
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
): BoardArrow[] {
  const arrows: BoardArrow[] = [];
  bestLines.forEach((line, index) => {
    const move = firstMove(line);
    if (!move || index >= BEST_COLOURS.length) return;
    arrows.push({
      ...move,
      color: BEST_COLOURS[index],
      weight: BEST_WEIGHTS[index],
    });
  });
  const threat = firstMove(threatLine);
  if (threat) {
    arrows.push({ ...threat, color: THREAT_COLOUR, weight: THREAT_WEIGHT });
  }
  return arrows;
}
