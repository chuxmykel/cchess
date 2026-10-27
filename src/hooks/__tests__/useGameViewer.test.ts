import { act, renderHook } from '@testing-library/react-native';

import { clocksAtPly, useGameViewer } from '../useGameViewer';
import { useAuthSession } from '../../context/AuthSessionContext';
import { getGame } from '../../network/restClient';
import { GameMoveSummary } from '../../network/socketEvents';
import { makeAuthSession } from '../../testUtils/authSession';
import { createFakeSocket, FakeSocket } from '../../testUtils/fakeSocket';
import { makeGameSnapshot } from '../../testUtils/gameSnapshot';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getGame: jest.fn(),
}));

const E4: GameMoveSummary = {
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
};

describe('useGameViewer', () => {
  let fake: FakeSocket;

  beforeEach(() => {
    fake = createFakeSocket();
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ socket: fake.socket }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  async function renderViewer() {
    const rendered = await renderHook(() => useGameViewer('game-1'));
    await act(async () => {});
    return rendered;
  }

  it('loads a finished game without watching it', async () => {
    const finished = makeGameSnapshot({ status: 'completed', result: 'white' });
    (getGame as jest.Mock).mockResolvedValue(finished);

    const { result } = await renderViewer();

    expect(result.current.state).toEqual({
      status: 'ready',
      snapshot: finished,
    });
    expect(fake.socket.emit).not.toHaveBeenCalledWith(
      'game:watch',
      expect.anything(),
    );
  });

  it('reports a game that fails to load', async () => {
    (getGame as jest.Mock).mockRejectedValue(new Error('offline'));

    const { result } = await renderViewer();

    expect(result.current.state).toEqual({ status: 'error' });
  });

  it('watches a game in progress, adding each move once', async () => {
    (getGame as jest.Mock).mockResolvedValue(makeGameSnapshot());
    const { result } = await renderViewer();
    expect(fake.socket.emit).toHaveBeenCalledWith('game:watch', {
      gameId: 'game-1',
    });

    const push = {
      gameId: 'game-1',
      move: E4,
      fen: E4.fenAfter,
      turn: 'b',
      whiteTimeRemainingMs: 299000,
      blackTimeRemainingMs: 300000,
      firstMoveDeadline: null,
    };
    await act(() => fake.trigger('game:move', push));
    await act(() => fake.trigger('game:move', push));

    const state = result.current.state;
    expect(state.status === 'ready' && state.snapshot.moves).toEqual([E4]);
    expect(state.status === 'ready' && state.snapshot.turn).toBe('b');
  });

  it('stops watching once the game is over', async () => {
    (getGame as jest.Mock).mockResolvedValue(makeGameSnapshot());
    const { result } = await renderViewer();

    await act(() =>
      fake.trigger(
        'game:over',
        makeGameSnapshot({ status: 'completed', result: 'black' }),
      ),
    );

    const state = result.current.state;
    expect(state.status === 'ready' && state.snapshot.result).toBe('black');
    expect(fake.socket.emit).toHaveBeenCalledWith('game:unwatch', {
      gameId: 'game-1',
    });
  });

  it("ignores another game's moves", async () => {
    (getGame as jest.Mock).mockResolvedValue(makeGameSnapshot());
    const { result } = await renderViewer();

    await act(() =>
      fake.trigger('game:move', {
        gameId: 'other-game',
        move: E4,
        fen: E4.fenAfter,
        turn: 'b',
        whiteTimeRemainingMs: 1,
        blackTimeRemainingMs: 1,
        firstMoveDeadline: null,
      }),
    );

    const state = result.current.state;
    expect(state.status === 'ready' && state.snapshot.moves).toEqual([]);
  });
});

describe('clocksAtPly', () => {
  const e5: GameMoveSummary = {
    ...E4,
    ply: 2,
    color: 'b',
    san: 'e5',
    clockAfterMs: 290000,
  };
  const nf3: GameMoveSummary = {
    ...E4,
    ply: 3,
    san: 'Nf3',
    clockAfterMs: 280000,
  };
  const game = makeGameSnapshot({
    status: 'completed',
    moves: [{ ...E4, clockAfterMs: 295000 }, e5, nf3],
    whiteTimeRemainingMs: 280000,
    blackTimeRemainingMs: 0,
  });

  it('starts both clocks full', () => {
    expect(clocksAtPly(game, 0)).toEqual({ whiteMs: 300000, blackMs: 300000 });
  });

  it("takes each side's clock from its last move so far", () => {
    expect(clocksAtPly(game, 2)).toEqual({ whiteMs: 295000, blackMs: 290000 });
  });

  it('ends on the clocks the game finished with', () => {
    expect(clocksAtPly(game, 3)).toEqual({ whiteMs: 280000, blackMs: 0 });
  });
});
