import { act, renderHook } from '@testing-library/react-native';
import { Chess } from 'chess.js';
import { createAudioPlayer } from 'expo-audio';

import { SOUNDS } from '../../constants/sounds';
import { useOnlineChessGame } from '../useOnlineChessGame';
import { GAME_RESULT_REASON } from '../../network/socketEvents';
import { createFakeSocket } from '../../testUtils/fakeSocket';
import { makeGameSnapshot } from '../../testUtils/gameSnapshot';

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

  it('lets the board pick up only my pieces, on my turn', async () => {
    const { socket } = createFakeSocket();
    const snapshot = makeGameSnapshot();
    const asBlack = await renderHook(() =>
      useOnlineChessGame(socket, GAME_ID, 'b', snapshot),
    );

    // White to move: neither white's pieces (the side to move, but not
    // mine) nor mine, out of turn.
    expect(asBlack.result.current.isOwnPieceAt('e2')).toBe(false);
    expect(asBlack.result.current.isOwnPieceAt('e7')).toBe(false);

    const asWhite = await renderHook(() =>
      useOnlineChessGame(socket, GAME_ID, 'w', snapshot),
    );
    expect(asWhite.result.current.isOwnPieceAt('e2')).toBe(true);
    expect(asWhite.result.current.isOwnPieceAt('e7')).toBe(false);
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
    expect(
      (socket.emit as jest.Mock).mock.calls.filter(
        ([event]) => event === 'game:move',
      ),
    ).toHaveLength(1);
  });

  it("sounds my move once, not again for its echo, and the opponent's", async () => {
    const { socket, trigger } = createFakeSocket();
    const snapshot = makeGameSnapshot();
    const { result } = await renderHook(() =>
      useOnlineChessGame(socket, GAME_ID, 'w', snapshot),
    );
    const movePlayer = jest.mocked(createAudioPlayer)(SOUNDS.move);
    jest.mocked(movePlayer.play).mockClear();
    const chess = new Chess();

    await act(() => {
      result.current.attemptMove('e2', 'e4');
    });
    chess.move('e4');
    const afterE4 = chess.fen();
    chess.move('e5');
    const afterE5 = chess.fen();
    for (const [ply, from, to, color, san, fen] of [
      [1, 'e2', 'e4', 'w', 'e4', afterE4],
      [2, 'e7', 'e5', 'b', 'e5', afterE5],
    ] as const) {
      await act(() => {
        trigger('game:move', {
          gameId: GAME_ID,
          move: {
            ply,
            from,
            to,
            piece: 'p',
            color,
            san,
            captured: null,
            promotion: null,
            fenAfter: fen,
            clockAfterMs: 299000,
          },
          fen,
          turn: color === 'w' ? 'b' : 'w',
          whiteTimeRemainingMs: 299000,
          blackTimeRemainingMs: 299000,
        });
      });
    }

    expect(result.current.fen).toBe(afterE5);
    expect(movePlayer.play).toHaveBeenCalledTimes(2);
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

  it('sounds a new game starting, and its end', async () => {
    const { socket, trigger } = createFakeSocket();
    const snapshot = makeGameSnapshot();
    const startPlayer = jest.mocked(createAudioPlayer)(SOUNDS['game-start']);
    const endPlayer = jest.mocked(createAudioPlayer)(SOUNDS['game-end']);
    jest.mocked(startPlayer.play).mockClear();
    jest.mocked(endPlayer.play).mockClear();

    await renderHook(() => useOnlineChessGame(socket, GAME_ID, 'w', snapshot));
    expect(startPlayer.play).toHaveBeenCalledTimes(1);
    expect(endPlayer.play).not.toHaveBeenCalled();

    await act(() => {
      trigger('game:over', {
        ...snapshot,
        status: 'completed',
        result: 'white',
        resultReason: GAME_RESULT_REASON.RESIGNATION,
      });
    });
    expect(endPlayer.play).toHaveBeenCalledTimes(1);
  });

  it('is quiet reopening a game already under way', async () => {
    const { socket } = createFakeSocket();
    const chess = new Chess();
    chess.move('e4');
    const snapshot = makeGameSnapshot({
      fen: chess.fen(),
      turn: 'b',
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
          fenAfter: chess.fen(),
          clockAfterMs: 300000,
        },
      ],
    });
    const startPlayer = jest.mocked(createAudioPlayer)(SOUNDS['game-start']);
    jest.mocked(startPlayer.play).mockClear();

    await renderHook(() => useOnlineChessGame(socket, GAME_ID, 'b', snapshot));

    expect(startPlayer.play).not.toHaveBeenCalled();
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

  describe('canAbort', () => {
    const AFTER_E4 =
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    const AFTER_E5 =
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';

    it('allows aborting before any move', async () => {
      const { socket } = createFakeSocket();
      const { result } = await renderHook(() =>
        useOnlineChessGame(socket, GAME_ID, 'w', makeGameSnapshot()),
      );

      expect(result.current.canAbort).toBe(true);
    });

    it("still allows aborting after white's first move", async () => {
      const { socket } = createFakeSocket();
      const snapshot = makeGameSnapshot({ fen: AFTER_E4, turn: 'b' });
      const { result } = await renderHook(() =>
        useOnlineChessGame(socket, GAME_ID, 'b', snapshot),
      );

      expect(result.current.canAbort).toBe(true);
    });

    it('stops allowing it once black has moved too', async () => {
      const { socket } = createFakeSocket();
      const snapshot = makeGameSnapshot({ fen: AFTER_E5, turn: 'w' });
      const { result } = await renderHook(() =>
        useOnlineChessGame(socket, GAME_ID, 'w', snapshot),
      );

      expect(result.current.canAbort).toBe(false);
    });

    it('counts our own move as soon as it is played', async () => {
      const { socket } = createFakeSocket();
      const snapshot = makeGameSnapshot({ fen: AFTER_E4, turn: 'b' });
      const { result } = await renderHook(() =>
        useOnlineChessGame(socket, GAME_ID, 'b', snapshot),
      );

      await act(() => {
        result.current.handleSquareTap('e7');
      });
      await act(() => {
        result.current.handleSquareTap('e5');
      });

      expect(result.current.canAbort).toBe(false);
    });

    it('stops allowing it once the game is over', async () => {
      const { socket, trigger } = createFakeSocket();
      const snapshot = makeGameSnapshot();
      const { result } = await renderHook(() =>
        useOnlineChessGame(socket, GAME_ID, 'w', snapshot),
      );

      await act(() => {
        trigger('game:over', {
          ...snapshot,
          status: 'aborted',
          resultReason: GAME_RESULT_REASON.ABORT,
        });
      });

      expect(result.current.canAbort).toBe(false);
    });
  });
});
