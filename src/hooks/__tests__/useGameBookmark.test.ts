import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useGameBookmark } from '../useGameBookmark';
import { useAuthSession } from '../../context/AuthSessionContext';
import { isGameBookmarked, setGameBookmarked } from '../../network/restClient';
import { BOOKMARK_FAILED_MESSAGE } from '../../constants/errorMessages';
import { makeAuthSession } from '../../testUtils/authSession';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  isGameBookmarked: jest.fn(),
  setGameBookmarked: jest.fn(),
}));

describe('useGameBookmark', () => {
  beforeEach(() => {
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ accessToken: 'token-123' }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('starts from whether the server has it bookmarked', async () => {
    (isGameBookmarked as jest.Mock).mockResolvedValue(true);

    const { result } = await renderHook(() => useGameBookmark('game-1'));

    await waitFor(() => expect(result.current.isBookmarked).toBe(true));
    expect(isGameBookmarked).toHaveBeenCalledWith('game-1', 'token-123');
  });

  it('toggles the bookmark straight away and tells the server', async () => {
    (isGameBookmarked as jest.Mock).mockResolvedValue(false);
    (setGameBookmarked as jest.Mock).mockResolvedValue(true);
    const { result } = await renderHook(() => useGameBookmark('game-1'));
    await waitFor(() => expect(isGameBookmarked).toHaveBeenCalled());

    await act(() => result.current.toggleBookmark());

    expect(result.current.isBookmarked).toBe(true);
    expect(setGameBookmarked).toHaveBeenCalledWith('game-1', true, 'token-123');
  });

  it('puts the bookmark back and reports it when the server refuses', async () => {
    (isGameBookmarked as jest.Mock).mockResolvedValue(false);
    (setGameBookmarked as jest.Mock).mockRejectedValue(new Error('offline'));
    const onError = jest.fn();
    const { result } = await renderHook(() =>
      useGameBookmark('game-1', onError),
    );
    await waitFor(() => expect(isGameBookmarked).toHaveBeenCalled());

    await act(() => result.current.toggleBookmark());

    expect(result.current.isBookmarked).toBe(false);
    expect(onError).toHaveBeenCalledWith(BOOKMARK_FAILED_MESSAGE);
  });
});
