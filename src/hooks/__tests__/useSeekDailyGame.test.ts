import { renderHook } from '@testing-library/react-native';

import { useSeekDailyGame } from '../useSeekDailyGame';
import { useAuthSession } from '../../context/AuthSessionContext';
import { createDailySeek, NewDailySeek } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { makeGameSnapshot } from '../../testUtils/gameSnapshot';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  createDailySeek: jest.fn(),
}));

const SEEK: NewDailySeek = {
  days: 3,
  rated: true,
  ratingRange: { below: 200, above: null },
  color: 'random',
};

describe('useSeekDailyGame', () => {
  beforeEach(() => {
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ accessToken: 'token-a' }),
    );
  });

  it('posts the seek, and names the game when it matched at once', async () => {
    (createDailySeek as jest.Mock).mockResolvedValue({
      status: 'matched',
      game: makeGameSnapshot({ id: 'game-9', gameType: 'daily' }),
    });
    const { result } = await renderHook(() => useSeekDailyGame());

    expect(await result.current(SEEK)).toEqual({
      status: 'matched',
      gameId: 'game-9',
    });
    expect(createDailySeek).toHaveBeenCalledWith(SEEK, 'token-a');
  });

  it('says when it was left waiting', async () => {
    (createDailySeek as jest.Mock).mockResolvedValue({
      status: 'queued',
      seek: { id: 'seek-1' },
    });
    const { result } = await renderHook(() => useSeekDailyGame());

    expect(await result.current(SEEK)).toEqual({ status: 'queued' });
  });
});
