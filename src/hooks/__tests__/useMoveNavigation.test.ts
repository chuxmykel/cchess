import { act, renderHook } from '@testing-library/react-native';
import { DEFAULT_POSITION } from 'chess.js';

import { useMoveNavigation } from '../useMoveNavigation';
import { GameMoveSummary } from '../../network/socketEvents';

const AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
const AFTER_E5 = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';
const AFTER_NF3 =
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2';

function move(ply: number, fenAfter: string): GameMoveSummary {
  return {
    ply,
    from: 'e2',
    to: 'e4',
    piece: 'p',
    color: ply % 2 === 1 ? 'w' : 'b',
    san: 'e4',
    captured: null,
    promotion: null,
    fenAfter,
    clockAfterMs: 300000,
  };
}

const TWO_MOVES = [move(1, AFTER_E4), move(2, AFTER_E5)];

describe('useMoveNavigation', () => {
  it('starts live, able to go back but not forward', async () => {
    const { result } = await renderHook(() => useMoveNavigation(TWO_MOVES));

    expect(result.current.isLive).toBe(true);
    expect(result.current.viewedFen).toBeNull();
    expect(result.current.canGoBack).toBe(true);
    expect(result.current.canGoForward).toBe(false);
  });

  it('steps back through each earlier position down to the start', async () => {
    const { result } = await renderHook(() => useMoveNavigation(TWO_MOVES));

    await act(() => result.current.back());
    expect(result.current.viewedFen).toBe(AFTER_E4);

    await act(() => result.current.back());
    expect(result.current.viewedFen).toBe(DEFAULT_POSITION);
    expect(result.current.canGoBack).toBe(false);

    await act(() => result.current.back());
    expect(result.current.viewedFen).toBe(DEFAULT_POSITION);
  });

  it('steps forward again and returns to live past the last move', async () => {
    const { result } = await renderHook(() => useMoveNavigation(TWO_MOVES));
    await act(() => result.current.back());
    await act(() => result.current.back());

    await act(() => result.current.forward());
    expect(result.current.viewedFen).toBe(AFTER_E4);

    await act(() => result.current.forward());
    expect(result.current.isLive).toBe(true);
    expect(result.current.canGoForward).toBe(false);
  });

  it('jumps straight back to live', async () => {
    const { result } = await renderHook(() => useMoveNavigation(TWO_MOVES));
    await act(() => result.current.back());

    await act(() => result.current.toLive());

    expect(result.current.isLive).toBe(true);
  });

  it('snaps back to live when a new move arrives', async () => {
    const { result, rerender } = await renderHook(
      (moves: GameMoveSummary[]) => useMoveNavigation(moves),
      { initialProps: TWO_MOVES },
    );
    await act(() => result.current.back());
    expect(result.current.isLive).toBe(false);

    await rerender([...TWO_MOVES, move(3, AFTER_NF3)]);

    expect(result.current.isLive).toBe(true);
    expect(result.current.viewedFen).toBeNull();
  });

  it('has nowhere to go before any move is played', async () => {
    const { result } = await renderHook(() => useMoveNavigation([]));

    expect(result.current.canGoBack).toBe(false);
    expect(result.current.canGoForward).toBe(false);
  });

  it('reports the current ply - the latest move while live', async () => {
    const { result } = await renderHook(() => useMoveNavigation(TWO_MOVES));
    expect(result.current.currentPly).toBe(2);

    await act(() => result.current.back());
    expect(result.current.currentPly).toBe(1);
  });

  it('jumps straight to a given move', async () => {
    const { result } = await renderHook(() => useMoveNavigation(TWO_MOVES));

    await act(() => result.current.goTo(1));
    expect(result.current.viewedFen).toBe(AFTER_E4);

    await act(() => result.current.goTo(0));
    expect(result.current.viewedFen).toBe(DEFAULT_POSITION);
  });

  it('returns to live when jumping to the latest move, and clamps out-of-range moves', async () => {
    const { result } = await renderHook(() => useMoveNavigation(TWO_MOVES));
    await act(() => result.current.goTo(0));

    await act(() => result.current.goTo(2));
    expect(result.current.isLive).toBe(true);

    await act(() => result.current.goTo(-5));
    expect(result.current.currentPly).toBe(0);

    await act(() => result.current.goTo(99));
    expect(result.current.isLive).toBe(true);
  });
});
