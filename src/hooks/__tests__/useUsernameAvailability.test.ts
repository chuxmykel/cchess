import { act, renderHook } from '@testing-library/react-native';

import {
  USERNAME_AVAILABILITY,
  USERNAME_CHECK_DELAY_MS,
  useUsernameAvailability,
} from '../useUsernameAvailability';
import { useAuthSession } from '../../context/AuthSessionContext';
import { ApiError, isUsernameAvailable } from '../../network/restClient';
import {
  makeAuthSession,
  makeBootstrappingAuthSession,
} from '../../testUtils/authSession';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  isUsernameAvailable: jest.fn(),
}));

describe('useUsernameAvailability', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ accessToken: 'token-a' }),
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  function renderAvailability(initialUsername: string) {
    return renderHook(
      ({ username }: { username: string }) => useUsernameAvailability(username),
      { initialProps: { username: initialUsername } },
    );
  }

  async function finishCheck() {
    await act(async () => {
      jest.advanceTimersByTime(USERNAME_CHECK_DELAY_MS);
    });
  }

  it.each([
    ['empty', ''],
    ['too short', 'ab'],
    ['too long', 'a'.repeat(21)],
    ['using other characters', 'magnus-c'],
  ])("doesn't check a name that's %s", async (_, username) => {
    const { result } = await renderAvailability(username);

    await finishCheck();

    expect(result.current).toBe(USERNAME_AVAILABILITY.NOT_CHECKED);
    expect(isUsernameAvailable).not.toHaveBeenCalled();
  });

  it('checks a valid name once typing pauses', async () => {
    (isUsernameAvailable as jest.Mock).mockResolvedValue(true);
    const { result } = await renderAvailability(' magnus ');

    expect(result.current).toBe(USERNAME_AVAILABILITY.CHECKING);
    expect(isUsernameAvailable).not.toHaveBeenCalled();

    await finishCheck();

    expect(isUsernameAvailable).toHaveBeenCalledWith('magnus', 'token-a');
    expect(result.current).toBe(USERNAME_AVAILABILITY.AVAILABLE);
  });

  it('reports a taken name', async () => {
    (isUsernameAvailable as jest.Mock).mockResolvedValue(false);
    const { result } = await renderAvailability('magnus');

    await finishCheck();

    expect(result.current).toBe(USERNAME_AVAILABILITY.TAKEN);
  });

  it('checks only the name typed last when typing quickly', async () => {
    (isUsernameAvailable as jest.Mock).mockResolvedValue(true);
    const { result, rerender } = await renderAvailability('mag');

    await act(async () => {
      jest.advanceTimersByTime(USERNAME_CHECK_DELAY_MS / 2);
    });
    await rerender({ username: 'magnus' });
    await finishCheck();

    expect(isUsernameAvailable).toHaveBeenCalledTimes(1);
    expect(isUsernameAvailable).toHaveBeenCalledWith('magnus', 'token-a');
    expect(result.current).toBe(USERNAME_AVAILABILITY.AVAILABLE);
  });

  it("ignores an earlier name's answer arriving after the name changed", async () => {
    let answerForMagnus: (available: boolean) => void;
    (isUsernameAvailable as jest.Mock)
      .mockReturnValueOnce(
        new Promise<boolean>((resolve) => (answerForMagnus = resolve)),
      )
      .mockResolvedValueOnce(true);
    const { result, rerender } = await renderAvailability('magnus');
    await finishCheck();

    await rerender({ username: 'magnus2' });
    await finishCheck();
    await act(async () => answerForMagnus(false));

    expect(result.current).toBe(USERNAME_AVAILABILITY.AVAILABLE);
  });

  it('shows checking again as soon as the name changes', async () => {
    (isUsernameAvailable as jest.Mock).mockResolvedValue(true);
    const { result, rerender } = await renderAvailability('magnus');
    await finishCheck();

    await rerender({ username: 'magnus2' });

    expect(result.current).toBe(USERNAME_AVAILABILITY.CHECKING);
  });

  it('shows nothing when the check fails, leaving it to sign-up', async () => {
    (isUsernameAvailable as jest.Mock).mockRejectedValue(
      new ApiError(0, 'Network Error'),
    );
    const { result } = await renderAvailability('magnus');

    await finishCheck();

    expect(result.current).toBe(USERNAME_AVAILABILITY.NOT_CHECKED);
  });

  it("doesn't check before the session is ready", async () => {
    (useAuthSession as jest.Mock).mockReturnValue(
      makeBootstrappingAuthSession(),
    );
    const { result } = await renderAvailability('magnus');

    await finishCheck();

    expect(result.current).toBe(USERNAME_AVAILABILITY.NOT_CHECKED);
    expect(isUsernameAvailable).not.toHaveBeenCalled();
  });
});
