import { act, renderHook } from '@testing-library/react-native';

import { EngineContext, EngineStatus } from '../../context/EngineContext';
import type { PositionEval } from '../../domain/review/types';
import { EngineUpdate } from '../../engine/types';
import {
  getGame,
  getGameReview,
  saveGameReview,
  StoredGameReview,
} from '../../network/restClient';
import { useAuthSession } from '../../context/AuthSessionContext';
import { makeAuthSession } from '../../testUtils/authSession';
import { makeFakeEngine } from '../../testUtils/fakeEngine';
import { makeFinishedGame } from '../../testUtils/gameSnapshot';
import { useGameReview } from '../useGameReview';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getGame: jest.fn(),
  getGameReview: jest.fn(),
  saveGameReview: jest.fn(),
}));

const GAME = makeFinishedGame(['e4', 'e5', 'Ba6', 'bxa6'], { id: 'game-1' });
const at = (cp: number, pv: string[]): PositionEval => ({
  score: { kind: 'cp', cp },
  pv,
  second: null,
  depth: 14,
});
const EVALS = [
  at(20, ['e2e4']),
  at(30, ['e7e5']),
  at(30, ['g1f3']),
  at(-300, ['b7a6']),
  at(-300, ['g1f3']),
];
const STORED: StoredGameReview = {
  gameId: 'game-1',
  engine: 'stockfish',
  depth: 14,
  whiteAccuracy: 50,
  blackAccuracy: 90,
  evals: EVALS,
  createdAt: '2026-11-15T00:00:00.000Z',
};

const line = (cp: number, pv: string[]): Partial<EngineUpdate> => ({
  depth: 14,
  done: true,
  lines: [{ multipv: 1, score: { kind: 'cp', cp }, pv }],
});

async function renderReview(
  status?: EngineStatus,
  gameId = 'game-1',
  strength: 'fast' | 'standard' = 'standard',
) {
  const main = makeFakeEngine();
  const threat = makeFakeEngine();
  const acquire = jest.fn(() => () => {});
  const value = {
    status: status ?? { kind: 'ready' as const, engines: { main, threat } },
    acquire,
    retry: jest.fn(),
  };
  const hook = await renderHook(() => useGameReview(gameId, strength), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <EngineContext.Provider value={value}>{children}</EngineContext.Provider>
    ),
  });
  return { ...hook, main, threat, acquire };
}

// Lets the runner's awaited searches move on.
const flush = () => act(async () => {});

describe('useGameReview', () => {
  beforeEach(() => {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
    (getGame as jest.Mock).mockResolvedValue(GAME);
    (getGameReview as jest.Mock).mockResolvedValue(null);
    (saveGameReview as jest.Mock).mockResolvedValue(STORED);
  });
  afterEach(() => jest.clearAllMocks());

  it('shows a review the server keeps, without starting the engine', async () => {
    (getGameReview as jest.Mock).mockResolvedValue(STORED);
    const { result, acquire } = await renderReview();
    await flush();

    expect(result.current.status).toBe('ready');
    if (result.current.status !== 'ready') return;
    expect(result.current.review.moves.map((m) => m.moveClass)).toEqual([
      'book',
      'book',
      'blunder',
      'best',
    ]);
    expect(acquire).not.toHaveBeenCalled();
  });

  it('analyses the game on the device, then keeps the review on the server', async () => {
    const { result, main, threat, acquire } = await renderReview();
    await flush();

    expect(acquire).toHaveBeenCalled();
    expect(result.current).toMatchObject({
      status: 'analysing',
      progress: 0,
      engine: { kind: 'running' },
    });
    // One position on each search at a time.
    expect(main.requests).toHaveLength(1);
    expect(threat.requests).toHaveLength(1);
    expect(main.requests[0].limit).toEqual({ depth: 14, movetimeMs: 1500 });

    const answers: [number, string[]][] = [
      [20, ['e2e4']],
      [30, ['e7e5']],
      [30, ['g1f3']],
      [-300, ['b7a6']],
      [-300, ['g1f3']],
    ];
    for (let i = 0; i < answers.length; i++) {
      const engine = i % 2 === 0 ? main : threat;
      await act(async () => engine.report(line(...answers[i])));
      await flush();
      if (i === 0) {
        expect(result.current).toMatchObject({ progress: 1 / 5 });
      }
    }

    expect(result.current.status).toBe('ready');
    expect(saveGameReview).toHaveBeenCalledWith(
      'game-1',
      expect.objectContaining({
        depth: 14,
        evals: expect.arrayContaining([
          expect.objectContaining({ pv: ['b7a6'] }),
        ]),
      }),
      'access-token',
    );
    const saved = (saveGameReview as jest.Mock).mock.calls[0][1];
    expect(saved.evals).toHaveLength(5);
    expect(saved.whiteAccuracy).toBeLessThan(saved.blackAccuracy);
  });

  it('says how the engine is coming along while it downloads', async () => {
    const { result } = await renderReview({
      kind: 'downloading',
      progress: 0.4,
    });
    await flush();

    expect(result.current).toMatchObject({
      status: 'analysing',
      engine: { kind: 'downloading', progress: 0.4 },
    });
  });

  it.each([
    ['in-play', { status: 'active' as const }],
    ['aborted', { status: 'aborted' as const }],
  ])('has no review for a game %s', async (reason, overrides) => {
    (getGame as jest.Mock).mockResolvedValue({ ...GAME, ...overrides });
    const { result, acquire } = await renderReview();
    await flush();

    expect(result.current).toMatchObject({ status: 'unavailable', reason });
    expect(acquire).not.toHaveBeenCalled();
  });

  it('has no review for a game with no moves', async () => {
    (getGame as jest.Mock).mockResolvedValue(makeFinishedGame([]));
    const { result } = await renderReview();
    await flush();

    expect(result.current).toMatchObject({
      status: 'unavailable',
      reason: 'no-moves',
    });
  });

  it('can be tried again when the game fails to load', async () => {
    (getGame as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    const { result } = await renderReview();
    await flush();
    expect(result.current.status).toBe('error');

    await act(async () => {
      if (result.current.status === 'error') result.current.retry();
    });
    await flush();
    expect(result.current.status).toBe('analysing');
  });

  it('carries on from where it was left, coming back to it', async () => {
    const first = await renderReview(undefined, 'game-2', 'fast');
    await flush();
    await act(async () => first.main.report(line(20, ['e2e4'])));
    await flush();
    await first.unmount();

    const again = await renderReview(undefined, 'game-2', 'fast');
    await flush();
    expect(again.result.current).toMatchObject({ progress: 1 / 5 });
    // The start's analysed already: the next two positions are asked for.
    const asked = [...again.main.requests, ...again.threat.requests].map(
      (r) => r.fen,
    );
    expect(asked).toEqual([GAME.moves[0].fenAfter, GAME.moves[1].fenAfter]);
  });
});
