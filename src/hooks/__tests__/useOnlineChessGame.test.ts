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
      result.current.attemptMove('e2', 'e4');
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

    let status: string;
    await act(() => {
      status = result.current.attemptMove('e7', 'e5').status;
    });

    expect(status).toBe('illegal');
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
    expect(asBlack.result.current.movableColor).toBeNull();

    const asWhite = await renderHook(() =>
      useOnlineChessGame(socket, GAME_ID, 'w', snapshot),
    );
    expect(asWhite.result.current.movableColor).toBe('w');
  });

  it('does not re-apply the echo of its own submitted move', async () => {
    const { socket, trigger } = createFakeSocket();
    const snapshot = makeGameSnapshot();
    const { result } = await renderHook(() =>
      useOnlineChessGame(socket, GAME_ID, 'w', snapshot),
    );

    await act(() => {
      result.current.attemptMove('e2', 'e4');
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
        result.current.attemptMove('e7', 'e5');
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

  describe('pre-moves', () => {
    /** The server's push of a move played from `chess`'s position. */
    function pushOf(chess: Chess, from: string, to: string) {
      const move = chess.move({ from, to, promotion: 'q' });
      const fen = chess.fen();
      return {
        gameId: GAME_ID,
        move: {
          ply: chess.history().length,
          from: move.from,
          to: move.to,
          piece: move.piece,
          color: move.color,
          san: move.san,
          captured: move.captured ?? null,
          promotion: move.promotion ?? null,
          fenAfter: fen,
          clockAfterMs: 299000,
        },
        fen,
        turn: chess.turn(),
        whiteTimeRemainingMs: 299000,
        blackTimeRemainingMs: 299900,
        firstMoveDeadline: null,
      };
    }

    function emitted(socket: { emit: unknown }, event: string) {
      return (socket.emit as jest.Mock).mock.calls.filter(
        ([name]) => name === event,
      );
    }

    async function asBlack(onError?: (message: string) => void) {
      const fake = createFakeSocket();
      const snapshot = makeGameSnapshot();
      const hook = await renderHook(() =>
        useOnlineChessGame(fake.socket, GAME_ID, 'b', snapshot, onError),
      );
      return { ...fake, ...hook, snapshot };
    }

    it("offers my pieces' premoves on the opponent's turn only", async () => {
      const { result } = await asBlack();
      expect(result.current.premovable?.color).toBe('b');
      expect(result.current.premovable?.dests.e7).toEqual(
        expect.arrayContaining(['e6', 'e5', 'd6', 'f6']),
      );

      const { socket } = createFakeSocket();
      const asWhite = await renderHook(() =>
        useOnlineChessGame(socket, GAME_ID, 'w', makeGameSnapshot()),
      );
      expect(asWhite.result.current.premovable).toBeNull();
    });

    it('sends a premove to the server, and marks it', async () => {
      const { socket, result } = await asBlack();

      await act(() => {
        result.current.setPremove('e7', 'e5');
      });

      expect(socket.emit).toHaveBeenCalledWith('game:premove', {
        gameId: GAME_ID,
        from: 'e7',
        to: 'e5',
        promotion: undefined,
      });
      expect(result.current.premovable?.current).toEqual({
        from: 'e7',
        to: 'e5',
      });
    });

    it('queues a queen for a pawn premoved to its last rank', async () => {
      const { socket } = createFakeSocket();
      const snapshot = makeGameSnapshot({
        fen: '4k3/P7/8/8/8/8/8/4K2r b - - 0 1',
        turn: 'b',
      });
      const { result } = await renderHook(() =>
        useOnlineChessGame(socket, GAME_ID, 'w', snapshot),
      );

      await act(() => {
        result.current.setPremove('a7', 'a8');
      });

      expect(socket.emit).toHaveBeenCalledWith(
        'game:premove',
        expect.objectContaining({ promotion: 'q' }),
      );
    });

    it("plays the server's pushes - the opponent's move, then mine - sending neither back", async () => {
      const onError = jest.fn();
      const { socket, trigger, result } = await asBlack(onError);
      await act(() => {
        result.current.setPremove('e7', 'e5');
      });
      const chess = new Chess();

      await act(() => {
        trigger('game:move', pushOf(chess, 'e2', 'e4'));
      });
      expect(result.current.premovable).toBeNull();
      await act(() => {
        trigger('game:move', pushOf(chess, 'e7', 'e5'));
      });

      expect(result.current.fen).toBe(chess.fen());
      expect(result.current.premovable?.current).toBeNull();
      expect(emitted(socket, 'game:move')).toHaveLength(0);
      expect(onError).not.toHaveBeenCalled();
    });

    it('plays both when they come in before a render', async () => {
      const { socket, trigger, result } = await asBlack();
      const chess = new Chess();

      await act(() => {
        trigger('game:move', pushOf(chess, 'e2', 'e4'));
        trigger('game:move', pushOf(chess, 'e7', 'e5'));
      });

      expect(result.current.fen).toBe(chess.fen());
      expect(emitted(socket, 'game:move')).toHaveLength(0);
    });

    it("drops the mark once the opponent's move is in, played or not", async () => {
      const { trigger, result } = await asBlack();
      await act(() => {
        result.current.setPremove('e5', 'd4');
      });

      await act(() => {
        trigger('game:move', pushOf(new Chess(), 'e2', 'e4'));
      });
      // White's turn again some time later: nothing still queued.
      expect(result.current.premovable).toBeNull();
    });

    it('cancels a premove', async () => {
      const { socket, result } = await asBlack();
      await act(() => {
        result.current.setPremove('e7', 'e5');
      });

      await act(() => {
        result.current.cancelPremove();
      });

      expect(socket.emit).toHaveBeenCalledWith('game:premoveCancel', {
        gameId: GAME_ID,
      });
      expect(result.current.premovable?.current).toBeNull();
    });

    it('drops a premove the server refuses, without a word', async () => {
      const onError = jest.fn();
      const { trigger, result } = await asBlack(onError);
      await act(() => {
        result.current.setPremove('e7', 'e5');
      });

      await act(() => {
        trigger('game:error', {
          gameId: GAME_ID,
          event: 'game:premove',
          message: 'Game is not active',
        });
      });

      expect(result.current.premovable?.current).toBeNull();
      expect(onError).not.toHaveBeenCalled();
    });

    it('cancels a premove the server still holds, back after a reconnect', async () => {
      const { socket, trigger, result, snapshot } = await asBlack();
      await act(() => {
        result.current.setPremove('e7', 'e5');
      });

      await act(() => {
        trigger('game:state', snapshot);
      });

      expect(socket.emit).toHaveBeenCalledWith('game:premoveCancel', {
        gameId: GAME_ID,
      });
      expect(result.current.premovable?.current).toBeNull();
    });
  });
});
