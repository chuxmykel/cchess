import { act, renderHook } from '@testing-library/react-native';
import { DEFAULT_POSITION } from 'chess.js';

import { usePositionEditor } from '../usePositionEditor';

describe('usePositionEditor', () => {
  it('starts from the starting position, or the one given', async () => {
    const fromStart = await renderHook(() => usePositionEditor());
    const given = await renderHook(() =>
      usePositionEditor('4k3/8/8/8/8/8/8/4K3 b - - 0 1'),
    );

    expect(fromStart.result.current.fen).toBe(DEFAULT_POSITION);
    expect(given.result.current.fen).toBe('4k3/8/8/8/8/8/8/4K3 b - - 0 1');
  });

  it('places the picked piece, and takes it off again with a second tap', async () => {
    const { result } = await renderHook(() =>
      usePositionEditor('4k3/8/8/8/8/8/8/4K3 w - - 0 1'),
    );

    await act(async () => result.current.setTool({ type: 'q', color: 'b' }));
    await act(async () => result.current.tapSquare('d5'));
    expect(result.current.setup.board.d5).toEqual({ type: 'q', color: 'b' });

    await act(async () => result.current.tapSquare('d5'));
    expect(result.current.setup.board.d5).toBeUndefined();
  });

  it('drags pieces with the hand, onto another square or off the board', async () => {
    const { result } = await renderHook(() =>
      usePositionEditor('4k3/8/8/8/8/8/3q4/4K3 w - - 0 1'),
    );

    await act(async () => result.current.setTool('move'));
    await act(async () => result.current.tapSquare('a1'));
    expect(result.current.setup.board.a1).toBeUndefined();

    await act(async () => result.current.movePiece('d2', 'e1'));
    expect(result.current.setup.board.e1).toEqual({ type: 'q', color: 'b' });
    expect(result.current.setup.board.d2).toBeUndefined();

    await act(async () => result.current.movePiece('e1', null));
    expect(result.current.fen.split(' ')[0]).toBe('4k3/8/8/8/8/8/8/8');
  });

  it('erases with the eraser', async () => {
    const { result } = await renderHook(() => usePositionEditor());

    await act(async () => result.current.setTool('erase'));
    await act(async () => result.current.tapSquare('e2'));

    expect(result.current.setup.board.e2).toBeUndefined();
  });

  it('says what stops the position being analysed', async () => {
    const { result } = await renderHook(() => usePositionEditor());

    await act(async () => result.current.clear());

    expect(result.current.errors).toEqual(['white-king', 'black-king']);
  });

  it("sets whose move it is, and castling only where it's possible", async () => {
    const { result } = await renderHook(() => usePositionEditor());

    await act(async () => result.current.setTurn('b'));
    await act(async () => result.current.toggleCastling('Q'));
    expect(result.current.fen.split(' ').slice(1, 3)).toEqual(['b', 'Kkq']);

    await act(async () => result.current.setTool('erase'));
    await act(async () => result.current.tapSquare('h8'));
    expect(result.current.availableCastling.k).toBe(false);
    expect(result.current.fen.split(' ')[2]).toBe('Kq');
  });
});
