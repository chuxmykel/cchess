import { act, renderHook } from '@testing-library/react-native';

import { clearGameSummaryCache, useGameSummary } from '../useGameSummary';
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

describe('useGameSummary', () => {
  beforeEach(() => {
    clearGameSummaryCache();
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches a game once, however many cards draw it', async () => {
    const game = makeGameSnapshot({ id: 'game-1' });
    (getGame as jest.Mock).mockResolvedValue(game);

    const first = await renderHook(() => useGameSummary('game-1'));
    const second = await renderHook(() => useGameSummary('game-1'));
    await act(async () => {});

    expect(first.result.current).toBe(game);
    expect(second.result.current).toBe(game);
    expect(getGame).toHaveBeenCalledTimes(1);
  });

  it("says when a game can't be had, and asks again next time", async () => {
    (getGame as jest.Mock).mockRejectedValueOnce(new Error('gone'));
    const { result } = await renderHook(() => useGameSummary('game-2'));
    await act(async () => {});
    expect(result.current).toBe('error');

    (getGame as jest.Mock).mockResolvedValue(
      makeGameSnapshot({ id: 'game-2' }),
    );
    const again = await renderHook(() => useGameSummary('game-2'));
    await act(async () => {});
    expect(getGame).toHaveBeenCalledTimes(2);
    expect(again.result.current).not.toBe('error');
  });
});
