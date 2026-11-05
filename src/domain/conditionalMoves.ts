import { AnalysisTree } from './analysisTree';
import { numberMoves, pvToSan } from './evalScore';

/** The node `plies` moves down the tree's main line - a game's position,
 * when the tree holds its moves; null past its end. */
export function mainLineNodeId(
  tree: AnalysisTree,
  plies: number,
): string | null {
  let id = tree.rootId;
  for (let i = 0; i < plies; i++) {
    const [first] = tree.nodes[id].children;
    if (!first) return null;
    id = first;
  }
  return id;
}

/**
 * The conditional moves a line tried in an analysis makes: the moves from
 * the game's position (`fromId`) down to the position looked at
 * (`toId`) - the opponent's, your reply, theirs... - ending on a reply,
 * since a last move of theirs says nothing about what to play. Null when
 * the position looked at isn't down a line from the game's, or the line
 * has no reply yet.
 */
export function conditionalLine(
  tree: AnalysisTree,
  fromId: string,
  toId: string,
): string[] | null {
  const moves: string[] = [];
  for (let at: string | null = toId; at !== fromId;) {
    if (at === null) return null;
    const node: (typeof tree.nodes)[string] = tree.nodes[at];
    if (!node.move) return null;
    moves.unshift(node.move.uci);
    at = node.parentId;
  }
  const line = moves.slice(0, moves.length - (moves.length % 2));
  return line.length > 0 ? line : null;
}

/** A line of UCI moves from a position, as it reads: "1... e5 2. Nf3". */
export function lineAsText(fen: string, line: string[]): string {
  return numberMoves(fen, pvToSan(fen, line))
    .map(({ label, san }) => (label ? `${label} ${san}` : san))
    .join(' ');
}
