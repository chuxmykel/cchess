import { act, renderHook } from '@testing-library/react-native';

import { useChessGame } from '../useChessGame';

describe('useChessGame', () => {
  it('starts with the standard setup, white to move', async () => {
    const { result } = await renderHook(() => useChessGame());

    expect(result.current.pieces).toHaveLength(32);
    expect(result.current.turn).toBe('w');
    expect(result.current.isGameOver).toBe(false);
    expect(result.current.movableColor).toBe('w');
    expect([...result.current.legalTargets.e2].sort()).toEqual(['e3', 'e4']);
  });

  it('makes a legal move, and the other side is to move', async () => {
    const { result } = await renderHook(() => useChessGame());

    await act(() => {
      result.current.attemptMove('e2', 'e4');
    });

    expect(result.current.turn).toBe('b');
    expect(result.current.movableColor).toBe('b');
    expect(result.current.pieces).toEqual(
      expect.arrayContaining([{ square: 'e4', type: 'p', color: 'w' }]),
    );
    expect(result.current.lastMove).toMatchObject({ from: 'e2', to: 'e4' });
  });

  it('rejects an illegal move without changing the board', async () => {
    const { result } = await renderHook(() => useChessGame());
    const before = result.current;

    let status: string;
    await act(() => {
      status = result.current.attemptMove('c1', 'c2').status; // bishop boxed in
    });

    expect(status).toBe('illegal');
    expect(result.current).toBe(before);
  });

  it('asks for a promotion choice instead of moving, then applies it once chosen', async () => {
    const { result } = await renderHook(() =>
      useChessGame('8/4P3/8/2k5/8/4K3/8/8 w - - 0 1'),
    );

    await act(() => {
      result.current.attemptMove('e7', 'e8');
    });

    expect(result.current.pendingPromotion).toEqual({ from: 'e7', to: 'e8' });
    expect(result.current.pieces).toEqual(
      expect.arrayContaining([{ square: 'e7', type: 'p', color: 'w' }]),
    );

    await act(() => {
      result.current.promoteTo('q');
    });

    expect(result.current.pendingPromotion).toBeNull();
    expect(result.current.pieces).toEqual(
      expect.arrayContaining([{ square: 'e8', type: 'q', color: 'w' }]),
    );
    expect(result.current.turn).toBe('b');
  });

  it('puts the pawn back when a promotion is cancelled', async () => {
    const { result } = await renderHook(() =>
      useChessGame('8/4P3/8/2k5/8/4K3/8/8 w - - 0 1'),
    );
    await act(() => {
      result.current.attemptMove('e7', 'e8');
    });

    await act(() => {
      result.current.cancelPromotion();
    });

    expect(result.current.pendingPromotion).toBeNull();
    expect(result.current.pieces).toEqual(
      expect.arrayContaining([{ square: 'e7', type: 'p', color: 'w' }]),
    );
    expect(result.current.turn).toBe('w');
  });

  it('resets to a position without a move', async () => {
    const start = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const { result } = await renderHook(() => useChessGame(start));
    await act(() => {
      result.current.attemptMove('e2', 'e4');
    });

    await act(() => {
      result.current.resetTo(start);
    });

    expect(result.current.fen).toBe(start);
    expect(result.current.turn).toBe('w');
    expect(result.current.lastMove).toBeNull();
    expect(result.current.pieces).toEqual(
      expect.arrayContaining([{ square: 'e2', type: 'p', color: 'w' }]),
    );
  });

  it('applies a promotion decided with the move, without asking', async () => {
    const { result } = await renderHook(() =>
      useChessGame('8/4P3/8/2k5/8/4K3/8/8 w - - 0 1'),
    );

    await act(() => {
      result.current.attemptMove('e7', 'e8', 'n');
    });

    expect(result.current.pendingPromotion).toBeNull();
    expect(result.current.pieces).toEqual(
      expect.arrayContaining([{ square: 'e8', type: 'n', color: 'w' }]),
    );
  });

  it('reports game over once checkmate is delivered', async () => {
    const { result } = await renderHook(() => useChessGame());

    await act(() => {
      result.current.attemptMove('f2', 'f3');
    });
    await act(() => {
      result.current.attemptMove('e7', 'e5');
    });
    await act(() => {
      result.current.attemptMove('g2', 'g4');
    });
    await act(() => {
      result.current.attemptMove('d8', 'h4');
    });

    expect(result.current.isGameOver).toBe(true);
  });

  it('tells onMoveApplied of every move made, promoted too, with the position reached', async () => {
    const onMoveApplied = jest.fn();
    const { result } = await renderHook(() =>
      useChessGame('7k/4P3/8/8/8/8/8/4K3 w - - 0 1', { onMoveApplied }),
    );

    await act(() => {
      result.current.attemptMove('e7', 'e8');
    });
    expect(onMoveApplied).not.toHaveBeenCalled();
    await act(() => {
      result.current.promoteTo('q');
    });

    expect(onMoveApplied).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'e7', to: 'e8', promotionPiece: 'q' }),
      '4Q2k/8/8/8/8/8/8/4K3 b - - 0 1',
    );
  });

  it('lets no piece move once the game is over', async () => {
    const { result } = await renderHook(() => useChessGame());

    await act(() => {
      result.current.attemptMove('f2', 'f3');
    });
    await act(() => {
      result.current.attemptMove('e7', 'e5');
    });
    await act(() => {
      result.current.attemptMove('g2', 'g4');
    });
    await act(() => {
      result.current.attemptMove('d8', 'h4');
    });
    expect(result.current.isGameOver).toBe(true);

    expect(result.current.movableColor).toBeNull();
  });
});
