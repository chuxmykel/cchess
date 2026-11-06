import { act, renderHook } from '@testing-library/react-native';
import { DEFAULT_POSITION } from 'chess.js';

import { useAnalysisTree } from '../useAnalysisTree';

function sanOf(result: { current: ReturnType<typeof useAnalysisTree> }) {
  return result.current.current.move?.san ?? null;
}

describe('useAnalysisTree', () => {
  it('starts at the start of an empty analysis', async () => {
    const { result } = await renderHook(() =>
      useAnalysisTree({ startFen: DEFAULT_POSITION }),
    );

    expect(result.current.current.fen).toBe(DEFAULT_POSITION);
    expect(result.current.canGoBack).toBe(false);
    expect(result.current.canGoForward).toBe(false);
    expect(result.current.tokens).toEqual([]);
  });

  it('starts at the end of the moves given, or at the move asked for', async () => {
    const moves = ['e2e4', 'e7e5', 'g1f3'];
    const atEnd = await renderHook(() =>
      useAnalysisTree({ startFen: DEFAULT_POSITION, uciMoves: moves }),
    );
    const atOne = await renderHook(() =>
      useAnalysisTree({
        startFen: DEFAULT_POSITION,
        uciMoves: moves,
        initialPly: 1,
      }),
    );

    expect(sanOf(atEnd.result)).toBe('Nf3');
    expect(sanOf(atOne.result)).toBe('e4');
    expect(atOne.result.current.canGoForward).toBe(true);
  });

  it('plays moves and steps back and forward through them', async () => {
    const { result } = await renderHook(() =>
      useAnalysisTree({ startFen: DEFAULT_POSITION }),
    );

    await act(async () => result.current.recordMove({ from: 'e2', to: 'e4' }));
    await act(async () => result.current.recordMove({ from: 'e7', to: 'e5' }));
    await act(async () => result.current.back());
    expect(sanOf(result)).toBe('e4');
    await act(async () => result.current.forward());
    expect(sanOf(result)).toBe('e5');
    await act(async () => result.current.toStart());
    expect(result.current.current.move).toBeNull();
    await act(async () => result.current.toEnd());
    expect(sanOf(result)).toBe('e5');
  });

  it('keeps a different move as a variation, and goes forward along it', async () => {
    const { result } = await renderHook(() =>
      useAnalysisTree({
        startFen: DEFAULT_POSITION,
        uciMoves: ['e2e4', 'e7e5', 'g1f3'],
        initialPly: 1,
      }),
    );

    // 1... c5 instead of 1... e5, then 2. Nf3 there too.
    await act(async () => result.current.recordMove({ from: 'c7', to: 'c5' }));
    await act(async () => result.current.recordMove({ from: 'g1', to: 'f3' }));
    await act(async () => result.current.back());
    await act(async () => result.current.back());
    await act(async () => result.current.forward());

    // Back the way it came - the variation, not the main line's e5.
    expect(sanOf(result)).toBe('c5');
    expect(
      result.current.tokens
        .filter((token) => token.kind === 'move')
        .map((token) => token.kind === 'move' && token.san),
    ).toEqual(['e4', 'e5', 'c5', 'Nf3', 'Nf3']);
  });

  it('keeps one line with singleLine, a different move replacing what followed', async () => {
    const { result } = await renderHook(() =>
      useAnalysisTree(
        {
          startFen: DEFAULT_POSITION,
          uciMoves: ['e2e4', 'e7e5', 'g1f3'],
          initialPly: 1,
        },
        { singleLine: true },
      ),
    );

    await act(async () => result.current.recordMove({ from: 'c7', to: 'c5' }));

    const sans = () =>
      result.current.line
        .slice(1)
        .map((id) => result.current.tree.nodes[id].move?.san);
    expect(sans()).toEqual(['e4', 'c5']);
    expect(result.current.canGoForward).toBe(false);

    // The move that followed, played again, keeps the line as it is.
    await act(async () => result.current.recordMove({ from: 'g1', to: 'f3' }));
    await act(async () => result.current.back());
    await act(async () => result.current.recordMove({ from: 'g1', to: 'f3' }));
    expect(sans()).toEqual(['e4', 'c5', 'Nf3']);
  });

  it('plays a line from the start, along the moves already there and on', async () => {
    const { result } = await renderHook(() =>
      useAnalysisTree({
        startFen: DEFAULT_POSITION,
        uciMoves: ['e2e4', 'e7e5'],
        initialPly: 0,
      }),
    );

    await act(async () =>
      result.current.playLine([
        { from: 'e2', to: 'e4' },
        { from: 'e7', to: 'e5' },
        { from: 'g1', to: 'f3' },
      ]),
    );

    expect(sanOf(result)).toBe('Nf3');
    expect(Object.keys(result.current.tree.nodes)).toHaveLength(4);
  });

  it("goes to a move that's already there rather than adding it again", async () => {
    const { result } = await renderHook(() =>
      useAnalysisTree({
        startFen: DEFAULT_POSITION,
        uciMoves: ['e2e4', 'e7e5'],
        initialPly: 0,
      }),
    );

    await act(async () => result.current.recordMove({ from: 'e2', to: 'e4' }));

    expect(sanOf(result)).toBe('e4');
    expect(result.current.tokens).toHaveLength(2);
    expect(result.current.canGoForward).toBe(true);
  });

  it('jumps to any move, and gives every position on the way there', async () => {
    const { result } = await renderHook(() =>
      useAnalysisTree({
        startFen: DEFAULT_POSITION,
        uciMoves: ['e2e4', 'e7e5', 'g1f3'],
      }),
    );
    const e5 = result.current.tokens[1];

    await act(async () =>
      result.current.goTo(e5.kind === 'move' ? e5.nodeId : ''),
    );

    expect(sanOf(result)).toBe('e5');
    expect(result.current.pathFens).toHaveLength(3);
    expect(result.current.pathFens[0]).toBe(DEFAULT_POSITION);
  });

  it('deletes the variation being looked at, going back to where it branched', async () => {
    const { result } = await renderHook(() =>
      useAnalysisTree({
        startFen: DEFAULT_POSITION,
        uciMoves: ['e2e4', 'e7e5'],
        initialPly: 1,
      }),
    );
    await act(async () => result.current.recordMove({ from: 'c7', to: 'c5' }));
    const c5 = result.current.current.id;

    await act(async () => result.current.deleteFrom(c5));

    expect(sanOf(result)).toBe('e4');
    expect(result.current.tokens).toHaveLength(2);
    await act(async () => result.current.forward());
    expect(sanOf(result)).toBe('e5');
  });

  it('promotes a variation to the main line', async () => {
    const { result } = await renderHook(() =>
      useAnalysisTree({
        startFen: DEFAULT_POSITION,
        uciMoves: ['e2e4', 'e7e5'],
        initialPly: 1,
      }),
    );
    await act(async () => result.current.recordMove({ from: 'c7', to: 'c5' }));

    await act(async () => result.current.promote(result.current.current.id));

    expect(
      result.current.tokens.map((token) =>
        token.kind === 'move' ? token.san : token.kind,
      ),
    ).toEqual(['e4', 'c5', 'open', 'e5', 'close']);
  });
});
