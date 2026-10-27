import { act, renderHook } from '@testing-library/react-native';

import { useGameServerEvents } from '../useGameServerEvents';
import { UseChessGameResult } from '../useChessGame';
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
    ...overrides,
  };
}

describe('useGameServerEvents', () => {
  it('seeds its state from the initial snapshot', async () => {
    const drawOfferedBy = 'b';
    const { socket } = createFakeSocket();
    const snapshot = makeGameSnapshot({
      status: 'active',
      whiteTimeRemainingMs: 300000,
      blackTimeRemainingMs: 280000,
      drawOfferedBy,
    });
    const { result } = await renderHook(() =>
      useGameServerEvents(socket, GAME_ID, snapshot, makeFakeGame()),
    );

    expect(result.current.gameStatus).toBe('active');
    expect(result.current.whiteTimeMs).toBe(300000);
    expect(result.current.blackTimeMs).toBe(280000);
    expect(result.current.drawOfferedBy).toBe(drawOfferedBy);
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

    expect(game.attemptMove).toHaveBeenCalledWith('e7', 'e5');
    expect(result.current.whiteTimeMs).toBe(300000);
    expect(result.current.blackTimeMs).toBe(299000);
  });

  it('chooses the pushed promotion once a move needs one', async () => {
    const { socket, trigger } = createFakeSocket();
    const snapshot = makeGameSnapshot();
    const game = makeFakeGame({
      attemptMove: jest.fn().mockReturnValue({
        status: 'needs-promotion-choice',
        from: 'e7',
        to: 'e8',
      }),
    });
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

    expect(game.promoteTo).toHaveBeenCalledWith('q');
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
      trigger('game:drawOffered', { gameId: GAME_ID, by: 'b' });
    });
    expect(result.current.drawOfferedBy).toBe('b');

    await act(() => {
      trigger('game:drawDeclined', { gameId: GAME_ID });
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
      trigger('game:drawOffered', { gameId: GAME_ID, by: 'b' });
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
      trigger('game:error', { gameId: GAME_ID, message: 'Illegal move' });
    });

    expect(onError).toHaveBeenCalledWith('Illegal move');
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
});
