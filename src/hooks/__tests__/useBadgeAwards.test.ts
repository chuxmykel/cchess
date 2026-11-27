import { act, renderHook } from '@testing-library/react-native';

import { useAuthSession } from '../../context/AuthSessionContext';
import { claimBadge, getBadges } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { makeBadge } from '../../testUtils/badges';
import { createFakeSocket } from '../../testUtils/fakeSocket';
import { useBadgeAwards } from '../useBadgeAwards';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getBadges: jest.fn(),
  claimBadge: jest.fn(() => Promise.resolve()),
}));

describe('useBadgeAwards', () => {
  const fake = createFakeSocket();
  beforeEach(() => {
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ socket: fake.socket }),
    );
  });
  afterEach(() => jest.clearAllMocks());

  async function awards(held = false) {
    const hook = await renderHook(({ hold }) => useBadgeAwards(hold), {
      initialProps: { hold: held },
    });
    await act(async () => {});
    return hook;
  }

  it('announces the badges not yet claimed, oldest first, one at a time', async () => {
    (getBadges as jest.Mock).mockResolvedValue([
      makeBadge({ id: 'new', claimedAt: null }),
      makeBadge({ id: 'old', kind: 'clean', claimedAt: null }),
      makeBadge({ id: 'done', claimedAt: '2026-11-01T00:00:00.000Z' }),
    ]);
    const { result } = await awards();

    expect(result.current.shown?.kind).toBe('clean');
    await act(async () => result.current.claim());
    expect(claimBadge).toHaveBeenCalledWith('old', 'access-token');
    // The comeback, with the time it was earned before.
    expect(result.current.shown?.kind).toBe('comeback');
    expect(result.current.shown?.awards.map((b) => b.id)).toEqual([
      'new',
      'done',
    ]);
    await act(async () => result.current.later());
    expect(result.current.shown).toBeNull();
  });

  it('announces a badge the server awards while online, unless held', async () => {
    (getBadges as jest.Mock).mockResolvedValue([]);
    const { result, rerender } = await awards(true);

    await act(async () =>
      fake.trigger('badge:awarded', { badges: [makeBadge({ id: 'x' })] }),
    );
    expect(result.current.shown).toBeNull();
    await rerender({ hold: false });
    expect(result.current.shown?.awards[0].id).toBe('x');
  });

  it('announces a badge waiting several times once, and claims them together', async () => {
    (getBadges as jest.Mock).mockResolvedValue([
      makeBadge({ id: 'm3', kind: 'miniature' }),
      makeBadge({ id: 'm2', kind: 'miniature' }),
      makeBadge({ id: 'm1', kind: 'miniature' }),
      makeBadge({
        id: 'g10',
        kind: 'gamesPlayed',
        value: 10,
        game: null,
      }),
    ]);
    const { result } = await awards();

    expect(result.current.shown?.kind).toBe('gamesPlayed');
    await act(async () => result.current.later());
    expect(result.current.shown?.awards.map((b) => b.id)).toEqual([
      'm3',
      'm2',
      'm1',
    ]);
    await act(async () => result.current.claim());
    expect(claimBadge).toHaveBeenCalledTimes(3);
    expect(result.current.shown).toBeNull();
  });
});
