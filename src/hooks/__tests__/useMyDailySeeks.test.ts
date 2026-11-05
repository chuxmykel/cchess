import { act, renderHook } from '@testing-library/react-native';

import { useMyDailySeeks } from '../useMyDailySeeks';
import { useAuthSession } from '../../context/AuthSessionContext';
import {
  cancelDailySeek,
  DailySeek,
  getMyDailySeeks,
} from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { createFakeSocket } from '../../testUtils/fakeSocket';
import { makeGameSnapshot } from '../../testUtils/gameSnapshot';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getMyDailySeeks: jest.fn(),
  cancelDailySeek: jest.fn(),
}));

function makeSeek(id: string): DailySeek {
  return {
    id,
    days: 3,
    rated: true,
    ratingRange: null,
    color: 'random',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('useMyDailySeeks', () => {
  let fake: ReturnType<typeof createFakeSocket>;

  beforeEach(() => {
    fake = createFakeSocket();
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ accessToken: 'token-a', socket: fake.socket }),
    );
    (getMyDailySeeks as jest.Mock).mockResolvedValue([
      makeSeek('a'),
      makeSeek('b'),
    ]);
    (cancelDailySeek as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads your waiting seeks', async () => {
    const { result } = await renderHook(() => useMyDailySeeks());
    expect(result.current.seeks).toBeNull();

    await act(async () => result.current.reload());

    expect(result.current.seeks?.map((seek) => seek.id)).toEqual(['a', 'b']);
  });

  it('withdraws one, dropping it at once', async () => {
    const { result } = await renderHook(() => useMyDailySeeks());
    await act(async () => result.current.reload());

    await act(() => result.current.cancel('a'));

    expect(cancelDailySeek).toHaveBeenCalledWith('a', 'token-a');
    expect(result.current.seeks?.map((seek) => seek.id)).toEqual(['b']);
  });

  it('looks again when a daily game starts, which one may have', async () => {
    const { result } = await renderHook(() => useMyDailySeeks());
    await act(async () => result.current.reload());
    (getMyDailySeeks as jest.Mock).mockResolvedValue([makeSeek('b')]);

    await act(async () =>
      fake.trigger('game:created', makeGameSnapshot({ gameType: 'blitz' })),
    );
    expect(getMyDailySeeks).toHaveBeenCalledTimes(1);
    await act(async () =>
      fake.trigger('game:created', makeGameSnapshot({ gameType: 'daily' })),
    );

    expect(result.current.seeks?.map((seek) => seek.id)).toEqual(['b']);
  });
});
