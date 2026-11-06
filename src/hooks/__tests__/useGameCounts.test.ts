import { act, renderHook } from '@testing-library/react-native';

import { useGameCounts } from '../useGameCounts';
import { useAuthSession } from '../../context/AuthSessionContext';
import { getMyGameCounts, getUserGameCounts } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getMyGameCounts: jest.fn(),
  getUserGameCounts: jest.fn(),
}));

const BLITZ_WINS = [{ result: 'win', gameType: 'blitz', count: 4 }];

describe('useGameCounts', () => {
  beforeEach(() => {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
    (getMyGameCounts as jest.Mock).mockResolvedValue(BLITZ_WINS);
    (getUserGameCounts as jest.Mock).mockResolvedValue([]);
  });
  afterEach(() => jest.clearAllMocks());

  it("counts my games, or the named player's", async () => {
    const mine = await renderHook(() => useGameCounts());
    await act(async () => {});
    expect(mine.result.current.counts).toEqual(BLITZ_WINS);

    const theirs = await renderHook(() => useGameCounts('magnus'));
    await act(async () => {});
    expect(getUserGameCounts).toHaveBeenCalledWith('magnus', 'access-token');
    expect(theirs.result.current.counts).toEqual([]);
  });

  it('keeps the counts it has when a reload fails', async () => {
    const { result } = await renderHook(() => useGameCounts());
    await act(async () => {});
    (getMyGameCounts as jest.Mock).mockRejectedValue(new Error('offline'));

    await act(async () => result.current.reload());

    expect(result.current.counts).toEqual(BLITZ_WINS);
  });
});
