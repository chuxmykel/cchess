import { act, renderHook } from '@testing-library/react-native';

import { useAuthSession } from '../../context/AuthSessionContext';
import { getBadges } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { makeBadge } from '../../testUtils/badges';
import { createFakeSocket } from '../../testUtils/fakeSocket';
import { useGameBadges } from '../useGameBadges';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getBadges: jest.fn(),
}));

const inGame = (id: string, gameId: string, kind = 'miniature' as const) =>
  makeBadge({
    id,
    kind,
    game: {
      gameId,
      opponentUsername: 'magnus',
      opponentDisplayName: 'Magnus',
      result: 'win',
      endedAt: '2026-11-05T10:00:00.000Z',
    },
  });

describe('useGameBadges', () => {
  const fake = createFakeSocket();
  beforeEach(() => {
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ socket: fake.socket }),
    );
  });
  afterEach(() => jest.clearAllMocks());

  it("shows none while the game's on, then those it earned", async () => {
    (getBadges as jest.Mock).mockResolvedValue([
      inGame('a', 'game-1'),
      inGame('b', 'other-game'),
    ]);
    const { result, rerender } = await renderHook(
      ({ over }) => useGameBadges('game-1', over),
      { initialProps: { over: false } },
    );
    await act(async () => {});
    expect(result.current).toEqual([]);
    expect(getBadges).not.toHaveBeenCalled();

    await rerender({ over: true });
    await act(async () => {});
    expect(result.current.map((b) => b.id)).toEqual(['a']);
  });

  it('adds those the server awards as the game ends', async () => {
    (getBadges as jest.Mock).mockResolvedValue([]);
    const { result } = await renderHook(() => useGameBadges('game-1', true));
    await act(async () => {});

    await act(async () =>
      fake.trigger('badge:awarded', {
        badges: [inGame('x', 'game-1'), inGame('y', 'other-game')],
      }),
    );
    expect(result.current.map((b) => b.id)).toEqual(['x']);
  });
});
