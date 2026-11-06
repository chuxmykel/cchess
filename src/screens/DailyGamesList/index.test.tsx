import { act, fireEvent, render } from '@testing-library/react-native';

import DailyGamesList from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import {
  cancelDailySeek,
  getDailyGames,
  getMyDailySeeks,
} from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { makeDailyGame } from '../../testUtils/dailyGame';
import { createFakeSocket } from '../../testUtils/fakeSocket';
import { withSafeArea } from '../../testUtils/safeArea';

jest.mock('@react-navigation/native', () =>
  jest.requireActual('../../testUtils/focusEffectRunsOnMount'),
);
jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getDailyGames: jest.fn(),
  getMyDailySeeks: jest.fn(),
  cancelDailySeek: jest.fn(),
}));

const SEEK = {
  id: 'seek-1',
  days: 3,
  rated: true,
  ratingRange: null,
  color: 'random' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('DailyGamesList', () => {
  beforeEach(() => {
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ socket: createFakeSocket().socket }),
    );
    (getMyDailySeeks as jest.Mock).mockResolvedValue([SEEK]);
    (cancelDailySeek as jest.Mock).mockResolvedValue(undefined);
  });
  afterEach(() => jest.clearAllMocks());

  async function renderList() {
    const navigation = { navigate: jest.fn() };
    const screen = await render(
      withSafeArea(<DailyGamesList navigation={navigation as never} />),
    );
    await act(async () => {});
    return { screen, navigation };
  }

  it('lists every game, in the order given, then the seeks waiting', async () => {
    const games = Array.from({ length: 12 }, (_, index) =>
      makeDailyGame({ id: `game-${index}` }),
    );
    (getDailyGames as jest.Mock).mockResolvedValue(games);
    const { screen } = await renderList();

    expect(getDailyGames).toHaveBeenCalledWith(expect.any(String), undefined);
    expect(screen.getByTestId('daily-game-game-0')).toBeTruthy();
    expect(screen.getByTestId('daily-seek-seek-1')).toBeTruthy();
  });

  it('opens a game, and withdraws a seek', async () => {
    (getDailyGames as jest.Mock).mockResolvedValue([
      makeDailyGame({ id: 'game-1' }),
    ]);
    const { screen, navigation } = await renderList();

    await fireEvent.press(screen.getByTestId('daily-game-game-1'));
    await fireEvent.press(screen.getByTestId('daily-seek-seek-1-cancel'));

    expect(navigation.navigate).toHaveBeenCalledWith('DailyGame', {
      gameId: 'game-1',
    });
    expect(cancelDailySeek).toHaveBeenCalledWith('seek-1', expect.any(String));
  });

  it('says so with none', async () => {
    (getDailyGames as jest.Mock).mockResolvedValue([]);
    (getMyDailySeeks as jest.Mock).mockResolvedValue([]);
    const { screen } = await renderList();

    expect(screen.getByTestId('daily-games-empty')).toBeTruthy();
  });
});
