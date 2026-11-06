import { Chess, Color, PieceSymbol, Square } from 'chess.js';

import { plyCountFromFen } from './fen';

// A move in an analysis, with what the board and the move list need of it.
export type TreeMove = {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
  san: string;
  uci: string;
  piece: PieceSymbol;
  color: Color;
  /** The piece it took, if any - for the material a side's captured. */
  captured?: PieceSymbol;
};

// A position in an analysis: the start, or one a move reached. Its first
// child continues its line; any others are variations.
export type AnalysisNode = {
  id: string;
  parentId: string | null;
  move: TreeMove | null;
  fen: string;
  // Half-moves since the game's own start, as the FEN counts them - so a
  // position set up mid-game numbers its moves on from there.
  ply: number;
  children: string[];
};

export type AnalysisTree = {
  rootId: string;
  nodes: Record<string, AnalysisNode>;
  nextId: number;
};

export type MoveSpec = { from: Square; to: Square; promotion?: PieceSymbol };

export function uciOf({ from, to, promotion }: MoveSpec): string {
  return `${from}${to}${promotion ?? ''}`;
}

export function createTree(startFen: string): AnalysisTree {
  const fen = new Chess(startFen).fen();
  return {
    rootId: '0',
    nodes: {
      '0': {
        id: '0',
        parentId: null,
        move: null,
        fen,
        ply: plyCountFromFen(fen),
        children: [],
      },
    },
    nextId: 1,
  };
}

// Plays a move from a position. One already there is gone to rather than
// added again - so replaying a line, or stepping forward by playing its move,
// doesn't grow the tree. Null for a move that isn't legal there.
export function addMove(
  tree: AnalysisTree,
  parentId: string,
  spec: MoveSpec,
): { tree: AnalysisTree; nodeId: string } | null {
  const parent = tree.nodes[parentId];
  if (!parent) return null;
  const uci = uciOf(spec);
  const existing = parent.children.find(
    (id) => tree.nodes[id].move?.uci === uci,
  );
  if (existing) return { tree, nodeId: existing };

  const chess = new Chess(parent.fen);
  let played;
  try {
    played = chess.move(spec);
  } catch {
    return null;
  }
  const id = String(tree.nextId);
  const node: AnalysisNode = {
    id,
    parentId,
    move: {
      from: played.from,
      to: played.to,
      promotion: played.promotion,
      san: played.san,
      uci: uciOf(played),
      piece: played.piece,
      color: played.color,
      ...(played.captured && { captured: played.captured }),
    },
    fen: chess.fen(),
    ply: parent.ply + 1,
    children: [],
  };
  return {
    tree: {
      ...tree,
      nodes: {
        ...tree.nodes,
        [parentId]: { ...parent, children: [...parent.children, id] },
        [id]: node,
      },
      nextId: tree.nextId + 1,
    },
    nodeId: id,
  };
}

// A tree of one line: the moves played from the start, as far as they're
// legal. Returns the line's positions after the start's, in order.
export function treeFromMoves(
  startFen: string,
  uciMoves: string[],
): { tree: AnalysisTree; line: string[] } {
  let tree = createTree(startFen);
  const line: string[] = [];
  let at = tree.rootId;
  for (const uci of uciMoves) {
    const added = addMove(tree, at, uciToMoveSpec(uci));
    if (!added) break;
    tree = added.tree;
    at = added.nodeId;
    line.push(at);
  }
  return { tree, line };
}

export function uciToMoveSpec(uci: string): MoveSpec {
  return {
    from: uci.slice(0, 2) as Square,
    to: uci.slice(2, 4) as Square,
    promotion: (uci[4] as PieceSymbol | undefined) || undefined,
  };
}

// Every position from the start to this one, the start first.
export function pathTo(tree: AnalysisTree, id: string): string[] {
  const path: string[] = [];
  for (let at: string | null = id; at !== null;) {
    path.unshift(at);
    at = tree.nodes[at].parentId;
  }
  return path;
}

// The whole line a position is on: the way to it, then on along each
// position's first child to the line's end.
export function lineThrough(tree: AnalysisTree, id: string): string[] {
  const line = pathTo(tree, id);
  for (let at = tree.nodes[id].children[0]; at;) {
    line.push(at);
    at = tree.nodes[at].children[0];
  }
  return line;
}

// Moves the variation a position is in up a place among its siblings - into
// the line it branched from, when it's the first.
export function promoteVariation(tree: AnalysisTree, id: string): AnalysisTree {
  // The branch point: the nearest position, from this one up, that isn't its
  // parent's first child.
  let at = id;
  while (tree.nodes[at].parentId !== null) {
    const parent = tree.nodes[tree.nodes[at].parentId as string];
    const index = parent.children.indexOf(at);
    if (index > 0) {
      const children = [...parent.children];
      [children[index - 1], children[index]] = [
        children[index],
        children[index - 1],
      ];
      return {
        ...tree,
        nodes: { ...tree.nodes, [parent.id]: { ...parent, children } },
      };
    }
    at = parent.id;
  }
  return tree;
}

// Whether the line from the tree's start to `id` is these moves from that
// position - the tree being where they'd start it afresh.
export function isLineTo(
  tree: AnalysisTree,
  id: string,
  startFen: string,
  uciMoves: string[],
): boolean {
  const path = pathTo(tree, id).slice(1);
  return (
    tree.nodes[tree.rootId].fen === new Chess(startFen).fen() &&
    path.length === uciMoves.length &&
    path.every(
      (nodeId, index) => tree.nodes[nodeId].move?.uci === uciMoves[index],
    )
  );
}

// Keeps only one of a position's continuations, removing the others and
// everything played from them - an analysis of a single line, where a new
// move from a position replaces what followed it.
export function keepOnlyChild(
  tree: AnalysisTree,
  parentId: string,
  childId: string,
): AnalysisTree {
  return tree.nodes[parentId].children
    .filter((id) => id !== childId)
    .reduce(deleteFrom, tree);
}

// Removes a position and everything played from it. The start stays.
export function deleteFrom(tree: AnalysisTree, id: string): AnalysisTree {
  const node = tree.nodes[id];
  if (!node || node.parentId === null) return tree;
  const nodes = { ...tree.nodes };
  const remove = (at: string) => {
    nodes[at].children.forEach(remove);
    delete nodes[at];
  };
  remove(id);
  const parent = nodes[node.parentId];
  nodes[parent.id] = {
    ...parent,
    children: parent.children.filter((child) => child !== id),
  };
  return { ...tree, nodes };
}

// The move list as it reads: each line's moves in turn, with a position's
// variations in brackets straight after the move they're alternatives to.
// A move is numbered when it's white's, or black's straight after a bracket
// opens or closes - "3...Nf6".
export type MoveListToken =
  | {
      kind: 'move';
      nodeId: string;
      san: string;
      label: string | null;
      depth: number;
    }
  | { kind: 'open'; depth: number }
  | { kind: 'close'; depth: number };

export function toMoveListTokens(tree: AnalysisTree): MoveListToken[] {
  const tokens: MoveListToken[] = [];
  const emitLine = (startId: string, depth: number) => {
    let numbered = true;
    for (let at: string | undefined = startId; at;) {
      const node: AnalysisNode = tree.nodes[at];
      const fromPly = node.ply - 1;
      const moveNumber = Math.floor(fromPly / 2) + 1;
      const isWhite = fromPly % 2 === 0;
      tokens.push({
        kind: 'move',
        nodeId: node.id,
        san: node.move?.san ?? '',
        label: isWhite
          ? `${moveNumber}.`
          : numbered
            ? `${moveNumber}...`
            : null,
        depth,
      });
      numbered = false;
      const parent = tree.nodes[node.parentId as string];
      if (parent.children[0] === node.id) {
        for (const variation of parent.children.slice(1)) {
          tokens.push({ kind: 'open', depth: depth + 1 });
          emitLine(variation, depth + 1);
          tokens.push({ kind: 'close', depth: depth + 1 });
          numbered = true;
        }
      }
      at = node.children[0];
    }
  };
  const first = tree.nodes[tree.rootId].children[0];
  if (first) emitLine(first, 0);
  return tokens;
}
