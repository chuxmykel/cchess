import { act, renderHook } from '@testing-library/react-native';

import { useOnlineChessGame } from '../useOnlineChessGame';
import { GAME_RESULT_REASON } from '../../network/socketEvents';
import { createFakeSocket } from '../../testUtils/fakeSocket';
import { makeGameSnapshot, STARTING_FEN } from '../../testUtils/gameSnapshot';

const GAME_ID = 'game-1';

describe('useOnlineChessGame', () => {
  it('applies and submits a local move when it is my turn', async () => {
    const { socket } = createFakeSocket();
    const snapshot = makeGameSnapshot();
    const { result } = await renderHook(() =>
      useOnlineChessGame(socket, GAME_ID, 'w', snapshot),
    );

    await act(() => {
      result.current.handleSquareTap('e2');
    });
    await act(() => {
      result.current.handleSquareTap('e4');
    });

    expect(result.current.pieces).toEqual(
      expect.arrayContaining([{ square: 'e4', type: 'p', color: 'w' }]),
    );
    expect(socket.emit).toHaveBeenCalledWith('game:move', {
      gameId: GAME_ID,
      from: 'e2',
      to: 'e4',
      promotion: undefined,
    });
  });

  it('does not let the local player move the opponent color or out of turn', async () => {
    const { socket } = createFakeSocket();
    const snapshot = makeGameSnapshot();
    const { result } = await renderHook(() =>
      useOnlineChessGame(socket, GAME_ID, 'b', snapshot),
    );

    await act(() => {
      result.current.handleSquareTap('e7');
    });

    expect(result.current.selectedSquare).toBeNull();
    expect(socket.emit).not.toHaveBeenCalledWith(
      'game:move',
      expect.anything(),
    );
  });

  it('does not re-apply the echo of its own submitted move', async () => {
    const { socket, trigger } = createFakeSocket();
    const snapshot = makeGameSnapshot();
    const { result } = await renderHook(() =>
      useOnlineChessGame(socket, GAME_ID, 'w', snapshot),
    );

    await act(() => {
      result.current.handleSquareTap('e2');
    });
    await act(() => {
      result.current.handleSquareTap('e4');
    });
    const fenAfterLocalMove = result.current.fen;

    await act(() => {
      trigger('game:move', {
        gameId: GAME_ID,
        move: {
          ply: 1,
          from: 'e2',
          to: 'e4',
          piece: 'p',
          color: 'w',
          san: 'e4',
          captured: null,
          promotion: null,
          fenAfter: fenAfterLocalMove,
          clockAfterMs: 299000,
        },
        fen: fenAfterLocalMove,
        turn: 'b',
        whiteTimeRemainingMs: 299000,
        blackTimeRemainingMs: 300000,
      });
    });

    expect(result.current.fen).toBe(fenAfterLocalMove);
    expect(result.current.whiteTimeMs).toBe(299000);
    // Just the one submission from the tap-to-move above.
    // Proves the echo didn't trigger a re-submission.
    expect(socket.emit).toHaveBeenCalledTimes(1);
  });

  it('reports isGameOver once the server reports the game as over', async () => {
    const { socket, trigger } = createFakeSocket();
    const snapshot = makeGameSnapshot();
    const { result } = await renderHook(() =>
      useOnlineChessGame(socket, GAME_ID, 'w', snapshot),
    );

    await act(() => {
      trigger('game:over', {
        ...snapshot,
        status: 'completed',
        result: 'white',
        resultReason: GAME_RESULT_REASON.RESIGNATION,
      });
    });

    expect(result.current.isGameOver).toBe(true);
  });

  it('emits resign/offerDraw/respondToDraw/abort with the gameId', async () => {
    const { socket } = createFakeSocket();
    const snapshot = makeGameSnapshot();
    const { result } = await renderHook(() =>
      useOnlineChessGame(socket, GAME_ID, 'w', snapshot),
    );

    await act(() => result.current.resign());
    expect(socket.emit).toHaveBeenCalledWith('game:resign', {
      gameId: GAME_ID,
    });

    await act(() => result.current.offerDraw());
    expect(socket.emit).toHaveBeenCalledWith('game:drawOffer', {
      gameId: GAME_ID,
    });

    await act(() => result.current.respondToDraw(true));
    expect(socket.emit).toHaveBeenCalledWith('game:drawRespond', {
      gameId: GAME_ID,
      accept: true,
    });

    await act(() => result.current.abort());
    expect(socket.emit).toHaveBeenCalledWith('game:abort', {
      gameId: GAME_ID,
    });
  });

  it('reports hasAnyMoveBeenMade from the initial snapshot', async () => {
    const { socket } = createFakeSocket();
    const snapshot = makeGameSnapshot({
      moves: [
        {
          ply: 1,
          from: 'e2',
          to: 'e4',
          piece: 'p',
          color: 'w',
          san: 'e4',
          captured: null,
          promotion: null,
          fenAfter: STARTING_FEN,
          clockAfterMs: 299000,
        },
      ],
    });
    const { result } = await renderHook(() =>
      useOnlineChessGame(socket, GAME_ID, 'w', snapshot),
    );

    expect(result.current.hasAnyMoveBeenMade).toBe(true);
  });
});
