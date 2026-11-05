import { DEFAULT_POSITION } from 'chess.js';

import {
  AnalysisTree,
  addMove,
  createTree,
  deleteFrom,
  keepOnlyChild,
  lineThrough,
  pathTo,
  promoteVariation,
  toMoveListTokens,
  treeFromMoves,
} from '../analysisTree';

// Plays moves one after another from a position, by their UCI.
function play(tree: AnalysisTree, fromId: string, ...ucis: string[]) {
  let at = fromId;
  for (const uci of ucis) {
    const added = addMove(tree, at, {
      from: uci.slice(0, 2) as never,
      to: uci.slice(2, 4) as never,
      promotion: (uci[4] as never) || undefined,
    });
    if (!added) throw new Error(`illegal ${uci}`);
    tree = added.tree;
    at = added.nodeId;
  }
  return { tree, at };
}

// The move list read out as text, brackets and all.
function moveListText(tree: AnalysisTree) {
  return toMoveListTokens(tree)
    .map((token) =>
      token.kind === 'move'
        ? `${token.label ?? ''}${token.san}`
        : token.kind === 'open'
          ? '('
          : ')',
    )
    .join(' ')
    .replace(/\( /g, '(')
    .replace(/ \)/g, ')');
}

describe('analysisTree', () => {
  it('starts from a position with no moves', () => {
    const tree = createTree(DEFAULT_POSITION);

    expect(tree.nodes[tree.rootId]).toMatchObject({
      fen: DEFAULT_POSITION,
      ply: 0,
      children: [],
      move: null,
    });
  });

  it('adds a move with its SAN, UCI and the position it reaches', () => {
    const { tree, at } = play(createTree(DEFAULT_POSITION), '0', 'e2e4');

    expect(tree.nodes[at]).toMatchObject({
      parentId: '0',
      ply: 1,
      move: { san: 'e4', uci: 'e2e4', piece: 'p', color: 'w' },
    });
    expect(tree.nodes[at].fen.split(' ')[1]).toBe('b');
  });

  it("goes to a move that's already there rather than adding it twice", () => {
    const first = play(createTree(DEFAULT_POSITION), '0', 'e2e4');
    const again = addMove(first.tree, '0', { from: 'e2', to: 'e4' });

    expect(again?.nodeId).toBe(first.at);
    expect(again?.tree).toBe(first.tree);
  });

  it('refuses an illegal move', () => {
    expect(
      addMove(createTree(DEFAULT_POSITION), '0', { from: 'e2', to: 'e5' }),
    ).toBeNull();
  });

  it('keeps the piece a move takes', () => {
    const { tree, at } = play(
      createTree(DEFAULT_POSITION),
      '0',
      'e2e4',
      'd7d5',
      'e4d5',
    );

    expect(tree.nodes[at].move?.captured).toBe('p');
  });

  it('keeps a promotion in the move', () => {
    const { tree, at } = play(
      createTree('8/4P3/8/8/8/8/k7/4K3 w - - 0 1'),
      '0',
      'e7e8n',
    );

    expect(tree.nodes[at].move).toMatchObject({
      san: 'e8=N',
      uci: 'e7e8n',
      promotion: 'n',
    });
  });

  it('builds a line from UCI moves, as far as they are legal', () => {
    const { tree, line } = treeFromMoves(DEFAULT_POSITION, [
      'e2e4',
      'e7e5',
      'e1e3',
      'g1f3',
    ]);

    expect(line.map((id) => tree.nodes[id].move?.san)).toEqual(['e4', 'e5']);
  });

  it('numbers moves on from a position set up mid-game', () => {
    const { tree } = treeFromMoves(
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      ['g1f3', 'b8c6'],
    );

    expect(moveListText(tree)).toBe('2.Nf3 Nc6');
  });

  it('starts a black-to-move position with its move number', () => {
    const { tree } = treeFromMoves(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      ['e7e5', 'g1f3'],
    );

    expect(moveListText(tree)).toBe('1...e5 2.Nf3');
  });

  describe('with a variation', () => {
    // 1. e4 e5 2. Nf3, and 1... c5 instead of e5.
    function sicilianAside() {
      const main = play(
        createTree(DEFAULT_POSITION),
        '0',
        'e2e4',
        'e7e5',
        'g1f3',
      );
      const e4 = main.tree.nodes['1'].id;
      const side = play(main.tree, e4, 'c7c5', 'g1f3');
      return { tree: side.tree, mainEnd: main.at, sideEnd: side.at };
    }

    it('reads with the variation in brackets after the move it replaces', () => {
      const { tree } = sicilianAside();

      expect(moveListText(tree)).toBe('1.e4 e5 (1...c5 2.Nf3) 2.Nf3');
    });

    it('gives the way to a position, and the whole line it is on', () => {
      const { tree, sideEnd } = sicilianAside();
      const c5 = tree.nodes[sideEnd].parentId as string;

      expect(pathTo(tree, c5).map((id) => tree.nodes[id].move?.san)).toEqual([
        undefined,
        'e4',
        'c5',
      ]);
      expect(
        lineThrough(tree, c5).map((id) => tree.nodes[id].move?.san),
      ).toEqual([undefined, 'e4', 'c5', 'Nf3']);
    });

    it('promotes the variation into the main line', () => {
      const { tree, sideEnd } = sicilianAside();

      expect(moveListText(promoteVariation(tree, sideEnd))).toBe(
        '1.e4 c5 (1...e5 2.Nf3) 2.Nf3',
      );
    });

    it('leaves the main line as it is when promoting it', () => {
      const { tree, mainEnd } = sicilianAside();

      expect(promoteVariation(tree, mainEnd)).toBe(tree);
    });

    it('deletes a variation and every move after it', () => {
      const { tree, sideEnd } = sicilianAside();
      const c5 = tree.nodes[sideEnd].parentId as string;
      const pruned = deleteFrom(tree, c5);

      expect(moveListText(pruned)).toBe('1.e4 e5 2.Nf3');
      expect(pruned.nodes[c5]).toBeUndefined();
      expect(pruned.nodes[sideEnd]).toBeUndefined();
    });

    it("keeps only one of a position's continuations", () => {
      const { tree, sideEnd } = sicilianAside();
      const c5 = tree.nodes[sideEnd].parentId as string;
      const e4 = tree.nodes[c5].parentId as string;

      expect(moveListText(keepOnlyChild(tree, e4, c5))).toBe('1.e4 c5 2.Nf3');
    });

    it('never deletes the start', () => {
      const { tree } = sicilianAside();

      expect(deleteFrom(tree, tree.rootId)).toBe(tree);
    });

    it('nests a variation inside a variation', () => {
      const { tree, sideEnd } = sicilianAside();
      const c5 = tree.nodes[sideEnd].parentId as string;
      const nested = play(tree, c5, 'b1c3').tree;

      expect(moveListText(nested)).toBe('1.e4 e5 (1...c5 2.Nf3 (2.Nc3)) 2.Nf3');
      expect(
        toMoveListTokens(nested).find(
          (t) => t.kind === 'move' && t.san === 'Nc3',
        ),
      ).toMatchObject({ depth: 2 });
    });
  });
});
