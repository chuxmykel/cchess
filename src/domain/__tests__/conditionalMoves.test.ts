import { DEFAULT_POSITION } from 'chess.js';

import { treeFromMoves, addMove, AnalysisTree } from '../analysisTree';
import {
  conditionalLine,
  lineAsText,
  mainLineNodeId,
} from '../conditionalMoves';

const AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';

function played(moves: string[]): { tree: AnalysisTree; ids: string[] } {
  const { tree, line } = treeFromMoves(DEFAULT_POSITION, moves);
  return { tree, ids: line };
}

describe('conditional moves', () => {
  it("finds the game's position down the main line", () => {
    const { tree, ids } = played(['e2e4', 'e7e5', 'g1f3']);

    expect(mainLineNodeId(tree, 0)).toBe(tree.rootId);
    expect(mainLineNodeId(tree, 1)).toBe(ids[0]);
    expect(mainLineNodeId(tree, 4)).toBeNull();
  });

  it("takes the moves from the game's position to the one looked at, ending on a reply", () => {
    const { tree, ids } = played(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5']);
    const game = ids[0];

    expect(conditionalLine(tree, game, ids[4])).toEqual([
      'e7e5',
      'g1f3',
      'b8c6',
      'f1b5',
    ]);
    expect(conditionalLine(tree, game, ids[3])).toEqual(['e7e5', 'g1f3']);
  });

  it("has none for a position that isn't down a line from the game's, or no reply yet", () => {
    const { tree, ids } = played(['e2e4', 'e7e5']);

    expect(conditionalLine(tree, ids[0], ids[1])).toBeNull();
    expect(conditionalLine(tree, ids[1], ids[0])).toBeNull();
    expect(conditionalLine(tree, ids[0], ids[0])).toBeNull();
  });

  it('follows a variation, not just the main line', () => {
    const { tree, ids } = played(['e2e4', 'e7e5', 'g1f3']);
    const withC5 = addMove(tree, ids[0], { from: 'c7', to: 'c5' })!;
    const withNc3 = addMove(withC5.tree, withC5.nodeId, {
      from: 'b1',
      to: 'c3',
    })!;

    expect(conditionalLine(withNc3.tree, ids[0], withNc3.nodeId)).toEqual([
      'c7c5',
      'b1c3',
    ]);
  });

  it('reads a line as it would be written', () => {
    expect(lineAsText(AFTER_E4, ['e7e5', 'g1f3'])).toBe('1... e5 2. Nf3');
  });
});
