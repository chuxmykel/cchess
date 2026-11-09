import { act, renderHook } from '@testing-library/react-native';

import { useOpeningExplorer } from '../useOpeningExplorer';
import { EXPLORER_FETCH_DELAY_MS } from '../../constants/explorer';
import { useAuthSession } from '../../context/AuthSessionContext';
import { ApiError, ExplorerQuery, getExplorer } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getExplorer: jest.fn(),
}));

const POSITION = {
  source: 'masters',
  stale: false,
  totalGames: 3,
  whiteWins: 1,
  draws: 1,
  blackWins: 1,
  moves: [],
};
const MASTERS: ExplorerQuery = { db: 'masters' };

const waitOutDelay = () =>
  act(async () => {
    jest.advanceTimersByTime(EXPLORER_FETCH_DELAY_MS);
  });

describe('useOpeningExplorer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
    (getExplorer as jest.Mock).mockResolvedValue(POSITION);
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('asks nothing without a database', async () => {
    const { result } = await renderHook(() => useOpeningExplorer('a', null));
    await waitOutDelay();

    expect(result.current).toEqual({ status: 'idle' });
    expect(getExplorer).not.toHaveBeenCalled();
  });

  it('asks once a position has been shown a moment, in the database given', async () => {
    const { result } = await renderHook(() => useOpeningExplorer('a', MASTERS));
    expect(result.current).toEqual({ status: 'loading' });
    expect(getExplorer).not.toHaveBeenCalled();

    await waitOutDelay();

    expect(getExplorer).toHaveBeenCalledWith('a', 'access-token', MASTERS);
    expect(result.current).toEqual({ status: 'ready', position: POSITION });
  });

  it('asks only where stepping stops', async () => {
    const { rerender } = await renderHook(
      ({ fen }) => useOpeningExplorer(fen, MASTERS),
      { initialProps: { fen: 'a' } },
    );
    await rerender({ fen: 'b' });
    await rerender({ fen: 'c' });
    await waitOutDelay();

    expect(getExplorer).toHaveBeenCalledTimes(1);
    expect((getExplorer as jest.Mock).mock.calls[0][0]).toBe('c');
  });

  it('asks about each position once a database, keeping what it was told', async () => {
    const { result, rerender } = await renderHook(
      ({ fen, query }) => useOpeningExplorer(fen, query),
      { initialProps: { fen: 'a', query: MASTERS } },
    );
    await waitOutDelay();
    await rerender({ fen: 'b', query: { db: 'masters' } });
    await waitOutDelay();
    await rerender({ fen: 'a', query: { db: 'masters' } });

    expect(result.current.status).toBe('ready');
    expect(getExplorer).toHaveBeenCalledTimes(2);

    await rerender({
      fen: 'a',
      query: { db: 'player', user: 'user-1', color: 'white' },
    });
    expect(result.current.status).toBe('loading');
    await waitOutDelay();
    expect(getExplorer).toHaveBeenCalledTimes(3);
  });

  it("says so when it couldn't ask, and asks again on coming back", async () => {
    (getExplorer as jest.Mock).mockRejectedValueOnce(new ApiError(500, 'boom'));
    const { result, rerender } = await renderHook(
      ({ fen }) => useOpeningExplorer(fen, MASTERS),
      { initialProps: { fen: 'a' } },
    );
    await waitOutDelay();
    expect(result.current).toEqual({ status: 'error' });

    await rerender({ fen: 'b' });
    await waitOutDelay();
    await rerender({ fen: 'a' });
    await waitOutDelay();

    expect(result.current).toEqual({ status: 'ready', position: POSITION });
  });
});
