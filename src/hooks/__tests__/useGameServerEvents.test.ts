import { act, renderHook } from '@testing-library/react-native';

import { useGameServerEvents } from '../useGameServerEvents';
import { useChessGame, UseChessGameResult } from '../useChessGame';
import {
  GAME_RESULT_REASON,
  GameMoveSummary,
} from '../../network/socketEvents';
import { createFakeSocket } from '../../testUtils/fakeSocket';
import { makeGameSnapshot } from '../../testUtils/gameSnapshot';

const GAME_ID = 'game-1';
const OPPONENT_MOVE_FEN =
  'rnbqkbnr/pppp1ppp/8/4p3/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 2';

function makeFakeGame(
  overrides: Partial<UseChessGameResult> = {},
): UseChessGameResult {
  return {
    pieces: [],
    fen: makeGameSnapshot().fen,
    turn: 'w',
    legalTargets: {},
    isGameOver: false,
    selectedSquare: null,
    legalMoveSquares: [],
    pendingPromotion: null,
    lastMove: null,
    isOwnPieceAt: jest.fn(),
    getLegalMoveSquares: jest.fn(),
    handleSquareTap: jest.fn(),
    attemptMove: jest.fn().mockReturnValue({
      status: 'ok',
      move: { from: 'e7', to: 'e5', piece: 'p', color: 'b' },
    }),
    promoteTo: jest.fn(),
    cancelPromotion: jest.fn(),
    resetTo: jest.fn(),
    ...overrides,
  };
}

describe('useGameServerEvents', () => {
  it('seeds its state from the initial snapshot', async () => {
    const { socket } = createFakeSocket();
    const snapshot = makeGameSnapshot({
      status: 'active',
      whiteTimeRemainingMs: 300000,
      blackTimeRemainingMs: 280000,
      drawOfferedBy: 'black',
    });
    const { result } = await renderHook(() =>
      useGameServerEvents(socket, GAME_ID, snapshot, makeFakeGame()),
    );

    expect(result.current.gameStatus).toBe('active');
    expect(result.current.whiteTimeMs).toBe(300000);
    expect(result.current.blackTimeMs).toBe(280000);
    expect(result.current.drawOfferedBy).toBe('b');
  });

  it('replays an incoming opponent move and updates the clocks', async () => {
    const { socket, trigger } = createFakeSocket();
    const snapshot = makeGameSnapshot();
    const game = makeFakeGame();
    const { result } = await renderHook(() =>
      useGameServerEvents(socket, GAME_ID, snapshot, game),
    );

    await act(() => {
      trigger('game:move', {
        gameId: GAME_ID,
        move: {
          ply: 1,
          from: 'e7',
          to: 'e5',
          piece: 'p',
          color: 'b',
          san: 'e5',
          captured: null,
          promotion: null,
          fenAfter: OPPONENT_MOVE_FEN,
          clockAfterMs: 299000,
        },
        fen: OPPONENT_MOVE_FEN,
        turn: 'w',
        whiteTimeRemainingMs: 300000,
        blackTimeRemainingMs: 299000,
      });
    });

    expect(game.attemptMove).toHaveBeenCalledWith('e7', 'e5', undefined);
    expect(result.current.whiteTimeMs).toBe(300000);
    expect(result.current.blackTimeMs).toBe(299000);
  });

  it("applies the opponent's promotion with its piece, in one go", async () => {
    const { socket, trigger } = createFakeSocket();
    const snapshot = makeGameSnapshot();
    const game = makeFakeGame();
    await renderHook(() =>
      useGameServerEvents(socket, GAME_ID, snapshot, game),
    );

    await act(() => {
      trigger('game:move', {
        gameId: GAME_ID,
        move: {
          ply: 1,
          from: 'e7',
          to: 'e8',
          piece: 'p',
          color: 'b',
          san: 'e8=Q',
          captured: null,
          promotion: 'q',
          fenAfter: OPPONENT_MOVE_FEN,
          clockAfterMs: 299000,
        },
        fen: OPPONENT_MOVE_FEN,
        turn: 'w',
        whiteTimeRemainingMs: 300000,
        blackTimeRemainingMs: 299000,
      });
    });

    expect(game.attemptMove).toHaveBeenCalledWith('e7', 'e8', 'q');
    expect(game.promoteTo).not.toHaveBeenCalled();
  });

  it("doesn't leave the opponent's promotion waiting for my choice", async () => {
    // A real game: black's pawn on e2 promotes on e1.
    const before = '4k3/8/8/8/8/8/4p3/K7 b - - 0 1';
    const after = '4k3/8/8/8/8/8/8/K3n3 w - - 0 2';
    const { socket, trigger } = createFakeSocket();
    const snapshot = makeGameSnapshot({ fen: before, turn: 'b' });
    const { result } = await renderHook(() => {
      const game = useChessGame(before);
      useGameServerEvents(socket, GAME_ID, snapshot, game);
      return game;
    });

    await act(() => {
      trigger('game:move', {
        gameId: GAME_ID,
        move: {
          ply: 1,
          from: 'e2',
          to: 'e1',
          piece: 'p',
          color: 'b',
          san: 'e1=N',
          captured: null,
          promotion: 'n',
          fenAfter: after,
          clockAfterMs: 299000,
        },
        fen: after,
        turn: 'w',
        whiteTimeRemainingMs: 300000,
        blackTimeRemainingMs: 299000,
      });
    });

    expect(result.current.pendingPromotion).toBeNull();
    expect(result.current.fen).toBe(after);
  });

  it('skips replaying the echo of its own move but still updates the clocks', async () => {
    const { socket, trigger } = createFakeSocket();
    const snapshot = makeGameSnapshot();
    const game = makeFakeGame({ fen: OPPONENT_MOVE_FEN });
    const { result } = await renderHook(() =>
      useGameServerEvents(socket, GAME_ID, snapshot, game),
    );

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
          fenAfter: OPPONENT_MOVE_FEN,
          clockAfterMs: 299000,
        },
        fen: OPPONENT_MOVE_FEN, // already matches game.fen - our own echo
        turn: 'b',
        whiteTimeRemainingMs: 299000,
        blackTimeRemainingMs: 300000,
      });
    });

    expect(game.attemptMove).not.toHaveBeenCalled();
    expect(result.current.whiteTimeMs).toBe(299000);
    expect(result.current.blackTimeMs).toBe(300000);
  });

  it('follows the first-move deadline from the snapshot, moves and game over', async () => {
    const { socket, trigger } = createFakeSocket();
    const snapshot = makeGameSnapshot({
      firstMoveDeadline: '2026-10-27T10:00:30.000Z',
    });
    const { result } = await renderHook(() =>
      useGameServerEvents(socket, GAME_ID, snapshot, makeFakeGame()),
    );
    expect(result.current.firstMoveDeadline).toBe('2026-10-27T10:00:30.000Z');

    await act(() => {
      trigger('game:move', {
        gameId: GAME_ID,
        move: {
          ply: 1,
          from: 'e7',
          to: 'e5',
          piece: 'p',
          color: 'b',
          san: 'e5',
          captured: null,
          promotion: null,
          fenAfter: OPPONENT_MOVE_FEN,
          clockAfterMs: 300000,
        },
        fen: OPPONENT_MOVE_FEN,
        turn: 'w',
        whiteTimeRemainingMs: 300000,
        blackTimeRemainingMs: 300000,
        firstMoveDeadline: '2026-10-27T10:00:40.000Z',
      });
    });
    expect(result.current.firstMoveDeadline).toBe('2026-10-27T10:00:40.000Z');

    await act(() => {
      trigger('game:over', {
        ...snapshot,
        status: 'aborted',
        resultReason: GAME_RESULT_REASON.ABORT,
      });
    });
    expect(result.current.firstMoveDeadline).toBeNull();
  });

  it('updates status/result/reason and clocks on game:over', async () => {
    const { socket, trigger } = createFakeSocket();
    const snapshot = makeGameSnapshot();
    const { result } = await renderHook(() =>
      useGameServerEvents(socket, GAME_ID, snapshot, makeFakeGame()),
    );

    await act(() => {
      trigger('game:over', {
        ...snapshot,
        status: 'completed',
        result: 'white',
        resultReason: GAME_RESULT_REASON.RESIGNATION,
        whiteTimeRemainingMs: 123000,
        blackTimeRemainingMs: 45000,
      });
    });

    expect(result.current.gameStatus).toBe('completed');
    expect(result.current.result).toBe('white');
    expect(result.current.resultReason).toBe(GAME_RESULT_REASON.RESIGNATION);
    expect(result.current.whiteTimeMs).toBe(123000);
    expect(result.current.blackTimeMs).toBe(45000);
  });

  it("starts with the snapshot's rating changes", async () => {
    const { socket } = createFakeSocket();
    const snapshot = makeGameSnapshot({
      status: 'completed',
      whiteRatingDiff: 8,
      blackRatingDiff: -8,
    });
    const { result } = await renderHook(() =>
      useGameServerEvents(socket, GAME_ID, snapshot, makeFakeGame()),
    );

    expect(result.current.whiteRatingDiff).toBe(8);
    expect(result.current.blackRatingDiff).toBe(-8);
  });

  it('takes the rating changes from game:over', async () => {
    const { socket, trigger } = createFakeSocket();
    const snapshot = makeGameSnapshot({ rated: true });
    const { result } = await renderHook(() =>
      useGameServerEvents(socket, GAME_ID, snapshot, makeFakeGame()),
    );
    expect(result.current.whiteRatingDiff).toBeNull();

    await act(() => {
      trigger('game:over', {
        ...snapshot,
        status: 'completed',
        result: 'black',
        resultReason: GAME_RESULT_REASON.CHECKMATE,
        whiteRatingDiff: -12,
        blackRatingDiff: 12,
      });
    });

    expect(result.current.whiteRatingDiff).toBe(-12);
    expect(result.current.blackRatingDiff).toBe(12);
  });

  it('tracks an incoming draw offer and clears it on decline', async () => {
    const { socket, trigger } = createFakeSocket();
    const snapshot = makeGameSnapshot();
    const { result } = await renderHook(() =>
      useGameServerEvents(socket, GAME_ID, snapshot, makeFakeGame()),
    );

    await act(() => {
      trigger('game:drawOffered', { gameId: GAME_ID, by: 'black' });
    });
    expect(result.current.drawOfferedBy).toBe('b');

    await act(() => {
      trigger('game:drawDeclined', { gameId: GAME_ID });
    });
    expect(result.current.drawOfferedBy).toBeNull();
  });

  it('lapses a draw offer when a move is played, as the server does', async () => {
    const { socket, trigger } = createFakeSocket();
    const snapshot = makeGameSnapshot();
    const { result } = await renderHook(() =>
      useGameServerEvents(socket, GAME_ID, snapshot, makeFakeGame()),
    );
    await act(() => {
      trigger('game:drawOffered', { gameId: GAME_ID, by: 'white' });
    });

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
          fenAfter: snapshot.fen,
          clockAfterMs: 300000,
        },
        fen: snapshot.fen,
        turn: 'b',
        whiteTimeRemainingMs: 300000,
        blackTimeRemainingMs: 300000,
      });
    });

    expect(result.current.drawOfferedBy).toBeNull();
  });

  it('clears the draw offer via clearDrawOffer', async () => {
    const { socket, trigger } = createFakeSocket();
    const snapshot = makeGameSnapshot();
    const { result } = await renderHook(() =>
      useGameServerEvents(socket, GAME_ID, snapshot, makeFakeGame()),
    );

    await act(() => {
      trigger('game:drawOffered', { gameId: GAME_ID, by: 'black' });
    });
    expect(result.current.drawOfferedBy).toBe('b');

    await act(() => {
      result.current.clearDrawOffer();
    });

    expect(result.current.drawOfferedBy).toBeNull();
  });

  it('calls onError for a game:error matching this game', async () => {
    const { socket, trigger } = createFakeSocket();
    const snapshot = makeGameSnapshot();
    const onError = jest.fn();
    await renderHook(() =>
      useGameServerEvents(socket, GAME_ID, snapshot, makeFakeGame(), onError),
    );

    await act(() => {
      trigger('game:error', {
        gameId: GAME_ID,
        event: 'game:move',
        message: 'Illegal move',
      });
    });

    expect(onError).toHaveBeenCalledWith('Illegal move');
  });

  describe('a move the server refuses', () => {
    const START = makeGameSnapshot().fen;
    const AFTER_E4 =
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';

    async function renderRealGame(onError = jest.fn()) {
      const { socket, trigger } = createFakeSocket();
      const snapshot = makeGameSnapshot();
      const rendered = await renderHook(() => {
        const game = useChessGame(snapshot.fen);
        useGameServerEvents(socket, GAME_ID, snapshot, game, onError);
        return game;
      });
      return { ...rendered, trigger };
    }

    it('goes back to the last position the server confirmed', async () => {
      const onError = jest.fn();
      const { result, trigger } = await renderRealGame(onError);
      await act(() => {
        result.current.attemptMove('e2', 'e4');
      });
      expect(result.current.fen).toBe(AFTER_E4);

      await act(() => {
        trigger('game:error', {
          gameId: GAME_ID,
          event: 'game:move',
          message: 'Game is not active',
        });
      });

      expect(result.current.fen).toBe(START);
      expect(result.current.turn).toBe('w');
      expect(result.current.lastMove).toBeNull();
      expect(
        result.current.pieces.find((piece) => piece.square === 'e2'),
      ).toMatchObject({ type: 'p', color: 'w' });
      expect(onError).toHaveBeenCalledWith('Game is not active');
    });

    it('keeps a move the server has confirmed', async () => {
      const { result, trigger } = await renderRealGame();
      await act(() => {
        result.current.attemptMove('e2', 'e4');
      });
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
            fenAfter: AFTER_E4,
            clockAfterMs: 299000,
          },
          fen: AFTER_E4,
          turn: 'b',
          whiteTimeRemainingMs: 299000,
          blackTimeRemainingMs: 300000,
        });
      });

      await act(() => {
        trigger('game:error', {
          gameId: GAME_ID,
          event: 'game:move',
          message: 'Not your turn',
        });
      });

      expect(result.current.fen).toBe(AFTER_E4);
    });

    it('leaves my move alone when something else is refused', async () => {
      const { result, trigger } = await renderRealGame();
      await act(() => {
        result.current.attemptMove('e2', 'e4');
      });

      await act(() => {
        trigger('game:error', {
          gameId: GAME_ID,
          event: 'game:drawOffer',
          message: 'Both players must move first',
        });
      });

      expect(result.current.fen).toBe(AFTER_E4);
    });
  });

  describe('move history', () => {
    function moveSummary(
      ply: number,
      overrides: Partial<GameMoveSummary> = {},
    ): GameMoveSummary {
      return {
        ply,
        from: 'e7',
        to: 'e5',
        piece: 'p',
        color: 'b',
        san: 'e5',
        captured: null,
        promotion: null,
        fenAfter: OPPONENT_MOVE_FEN,
        clockAfterMs: 299000,
        ...overrides,
      };
    }

    function pushMove(
      trigger: (event: string, payload: unknown) => void,
      move: GameMoveSummary,
    ) {
      trigger('game:move', {
        gameId: GAME_ID,
        move,
        fen: move.fenAfter,
        turn: move.color === 'w' ? 'b' : 'w',
        whiteTimeRemainingMs: 300000,
        blackTimeRemainingMs: 299000,
      });
    }

    it("starts from the snapshot's moves", async () => {
      const { socket } = createFakeSocket();
      const snapshotMoves = [
        moveSummary(1, { color: 'w', from: 'e2', to: 'e4', san: 'e4' }),
      ];
      const snapshot = makeGameSnapshot({ moves: snapshotMoves });
      const { result } = await renderHook(() =>
        useGameServerEvents(socket, GAME_ID, snapshot, makeFakeGame()),
      );

      expect(result.current.moves).toEqual(snapshotMoves);
    });

    it('adds each pushed move, ignoring one it already has', async () => {
      const { socket, trigger } = createFakeSocket();
      const { result } = await renderHook(() =>
        useGameServerEvents(
          socket,
          GAME_ID,
          makeGameSnapshot(),
          makeFakeGame(),
        ),
      );
      const first = moveSummary(1, { color: 'w', san: 'e4' });
      const second = moveSummary(2);

      await act(() => pushMove(trigger, first));
      await act(() => pushMove(trigger, second));
      await act(() => pushMove(trigger, second));

      expect(result.current.moves).toEqual([first, second]);
    });
  });

  describe('rejoining after a reconnect', () => {
    const AFTER_E4_E5 =
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';
    const MISSED_MOVES: GameMoveSummary[] = [
      {
        ply: 1,
        from: 'e2',
        to: 'e4',
        piece: 'p',
        color: 'w',
        san: 'e4',
        captured: null,
        promotion: null,
        fenAfter: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
        clockAfterMs: 300000,
      },
      {
        ply: 2,
        from: 'e7',
        to: 'e5',
        piece: 'p',
        color: 'b',
        san: 'e5',
        captured: null,
        promotion: null,
        fenAfter: AFTER_E4_E5,
        clockAfterMs: 300000,
      },
    ];

    async function renderRealGame() {
      const { socket, trigger } = createFakeSocket();
      const snapshot = makeGameSnapshot();
      const rendered = await renderHook(() => {
        const game = useChessGame(snapshot.fen);
        const events = useGameServerEvents(socket, GAME_ID, snapshot, game);
        return { game, events };
      });
      return { ...rendered, snapshot, trigger };
    }

    it('catches up on the moves played while away, board included', async () => {
      const { result, snapshot, trigger } = await renderRealGame();

      await act(() => {
        trigger('game:state', {
          ...snapshot,
          fen: AFTER_E4_E5,
          turn: 'w',
          moves: MISSED_MOVES,
          whiteTimeRemainingMs: 290000,
          blackTimeRemainingMs: 295000,
          firstMoveDeadline: null,
        });
      });

      expect(result.current.game.fen).toBe(AFTER_E4_E5);
      expect(result.current.game.turn).toBe('w');
      // Not played here, so not animated or sounded.
      expect(result.current.game.lastMove).toBeNull();
      expect(result.current.events.moves).toEqual(MISSED_MOVES);
      expect(result.current.events.whiteTimeMs).toBe(290000);
      expect(result.current.events.blackTimeMs).toBe(295000);
      expect(result.current.events.firstMoveDeadline).toBeNull();
    });

    it('learns how a game ended while away', async () => {
      const { result, snapshot, trigger } = await renderRealGame();

      await act(() => {
        trigger('game:state', {
          ...snapshot,
          status: 'completed',
          result: 'black',
          resultReason: GAME_RESULT_REASON.RESIGNATION,
          drawOfferedBy: null,
        });
      });

      expect(result.current.events.gameStatus).toBe('completed');
      expect(result.current.events.result).toBe('black');
      expect(result.current.events.resultReason).toBe(
        GAME_RESULT_REASON.RESIGNATION,
      );
    });

    it('leaves the board alone when nothing was missed', async () => {
      const { socket, trigger } = createFakeSocket();
      const snapshot = makeGameSnapshot();
      const game = makeFakeGame();
      await renderHook(() =>
        useGameServerEvents(socket, GAME_ID, snapshot, game),
      );

      await act(() => {
        trigger('game:state', snapshot);
      });

      expect(game.resetTo).not.toHaveBeenCalled();
    });

    it("ignores another game's state", async () => {
      const { result, snapshot, trigger } = await renderRealGame();

      await act(() => {
        trigger('game:state', {
          ...snapshot,
          id: 'another-game',
          fen: AFTER_E4_E5,
          moves: MISSED_MOVES,
        });
      });

      expect(result.current.game.fen).toBe(snapshot.fen);
      expect(result.current.events.moves).toEqual([]);
    });
  });
});
