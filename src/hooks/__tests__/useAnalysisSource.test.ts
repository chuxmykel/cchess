import { act, renderHook } from '@testing-library/react-native';
import { DEFAULT_POSITION } from 'chess.js';

import { useAnalysisSource } from '../useAnalysisSource';
import { useAuthSession } from '../../context/AuthSessionContext';
import { getGame } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { makeGameSnapshot } from '../../testUtils/gameSnapshot';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getGame: jest.fn(),
}));

const MOVES = [
  { from: 'e2', to: 'e4', promotion: null },
  { from: 'e7', to: 'e5', promotion: null },
];

describe('useAnalysisSource', () => {
  beforeEach(() => {
    jest
      .mocked(useAuthSession)
      .mockReturnValue(makeAuthSession({ user: { id: 'me' } }));
  });

  it('starts a new analysis from the starting position, at once', async () => {
    const { result } = await renderHook(() =>
      useAnalysisSource({ kind: 'new' }),
    );

    expect(result.current.state).toEqual({
      status: 'ready',
      start: { startFen: DEFAULT_POSITION },
      orientation: 'w',
    });
  });

  it('starts from what was brought in', async () => {
    const { result } = await renderHook(() =>
      useAnalysisSource({
        kind: 'import',
        startFen: DEFAULT_POSITION,
        uciMoves: ['e2e4'],
      }),
    );

    expect(result.current.state).toMatchObject({
      status: 'ready',
      start: { startFen: DEFAULT_POSITION, uciMoves: ['e2e4'] },
    });
  });

  it('refuses your own daily game still being played, unless asked to allow it', async () => {
    const snapshot = makeGameSnapshot({ gameType: 'daily', status: 'active' });
    jest.mocked(getGame).mockResolvedValue({
      ...snapshot,
      white: { ...snapshot.white, id: 'me' },
    });

    const refused = await renderHook(() =>
      useAnalysisSource({ kind: 'game', gameId: 'game-1' }),
    );
    await act(async () => {});
    expect(refused.result.current.state).toEqual({ status: 'in-play' });

    const allowed = await renderHook(() =>
      useAnalysisSource(
        { kind: 'game', gameId: 'game-1' },
        { allowDailyInPlay: true },
      ),
    );
    await act(async () => {});
    expect(allowed.result.current.state.status).toBe('ready');
  });

  it("lets anyone analyse someone else's daily game", async () => {
    jest
      .mocked(getGame)
      .mockResolvedValue(
        makeGameSnapshot({ gameType: 'daily', status: 'active' }),
      );
    const { result } = await renderHook(() =>
      useAnalysisSource({ kind: 'game', gameId: 'game-1' }),
    );
    await act(async () => {});

    expect(result.current.state.status).toBe('ready');
  });

  it("fetches a game, starting at the move asked for, from the player's side", async () => {
    const snapshot = makeGameSnapshot();
    jest.mocked(getGame).mockResolvedValue({
      ...snapshot,
      black: { ...snapshot.black, id: 'me' },
      moves: MOVES as never,
    });
    const { result } = await renderHook(() =>
      useAnalysisSource({ kind: 'game', gameId: 'game-1', ply: 1 }),
    );
    await act(async () => {});

    expect(getGame).toHaveBeenCalledWith('game-1', 'access-token');
    expect(result.current.state).toEqual({
      status: 'ready',
      start: {
        startFen: DEFAULT_POSITION,
        uciMoves: ['e2e4', 'e7e5'],
        initialPly: 1,
      },
      orientation: 'b',
    });
  });

  it("analyses a game that didn't start from the usual position from where it ended", async () => {
    const endedAt = 'R5k1/5ppp/8/8/8/8/5PPP/6K1 b - - 1 1';
    jest.mocked(getGame).mockResolvedValue(
      makeGameSnapshot({
        fen: endedAt,
        moves: [{ from: 'a1', to: 'a8', promotion: null }] as never,
      }),
    );
    const { result } = await renderHook(() =>
      useAnalysisSource({ kind: 'game', gameId: 'game-1' }),
    );
    await act(async () => {});

    expect(result.current.state).toMatchObject({
      status: 'ready',
      start: { startFen: endedAt },
    });
  });

  it('says when the game cannot be fetched, and tries again', async () => {
    jest.mocked(getGame).mockRejectedValueOnce(new Error('offline'));
    const { result } = await renderHook(() =>
      useAnalysisSource({ kind: 'game', gameId: 'game-1' }),
    );
    await act(async () => {});
    expect(result.current.state).toEqual({ status: 'error' });

    jest.mocked(getGame).mockResolvedValue(makeGameSnapshot());
    await act(async () => result.current.reload());

    expect(result.current.state).toMatchObject({ status: 'ready' });
  });
});
