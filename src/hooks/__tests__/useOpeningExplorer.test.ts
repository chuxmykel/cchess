import { act, renderHook } from '@testing-library/react-native';

import { useOpeningExplorer } from '../useOpeningExplorer';
import { useAuthSession } from '../../context/AuthSessionContext';
import { ApiError, getExplorer } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getExplorer: jest.fn(),
}));

const POSITION = { totalGames: 3, moves: [] };

describe('useOpeningExplorer', () => {
  beforeEach(() => {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
    (getExplorer as jest.Mock).mockResolvedValue(POSITION);
  });
  afterEach(() => jest.clearAllMocks());

  it('asks nothing while closed', async () => {
    const { result } = await renderHook(() => useOpeningExplorer('a', false));

    expect(result.current).toEqual({ status: 'idle' });
    expect(getExplorer).not.toHaveBeenCalled();
  });

  it('asks about each position once, keeping what it was told', async () => {
    const { result, rerender } = await renderHook(
      ({ fen }) => useOpeningExplorer(fen, true),
      { initialProps: { fen: 'a' } },
    );
    await act(async () => {});
    expect(result.current).toEqual({ status: 'ready', position: POSITION });

    await rerender({ fen: 'b' });
    await act(async () => {});
    await rerender({ fen: 'a' });
    await act(async () => {});

    expect(getExplorer).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('ready');
  });

  it("says so when it couldn't ask", async () => {
    (getExplorer as jest.Mock).mockRejectedValue(new ApiError(500, 'boom'));
    const { result } = await renderHook(() => useOpeningExplorer('a', true));
    await act(async () => {});

    expect(result.current).toEqual({ status: 'error' });
  });
});
