import { act, fireEvent, render } from '@testing-library/react-native';
import { Dimensions, StyleSheet } from 'react-native';

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
import { lightTheme, spacing } from '../../theme';

jest.mock('@react-navigation/native', () =>
  jest.requireActual('../../testUtils/focusEffectRunsOnMount'),
);
jest.mock('../../hooks/usePopoverMenu', () =>
  jest.requireActual('../../testUtils/popoverMenuStartingOpen'),
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

  describe('filtered and sorted', () => {
    const HOUR = 60 * 60 * 1000;
    const inHours = (hours: number) =>
      new Date(Date.now() + hours * HOUR).toISOString();
    const GAMES = [
      makeDailyGame({ id: 'mine', myTurn: true, moveDeadlineAt: inHours(20) }),
      makeDailyGame({
        id: 'theirs',
        myTurn: false,
        moveDeadlineAt: inHours(2),
      }),
    ];
    const order = (screen: Awaited<ReturnType<typeof render>>) =>
      screen
        .getAllByTestId(/^daily-(game-(mine|theirs)|seek-seek-1)$/)
        .map((card) => card.props.testID);

    beforeEach(() => {
      (getDailyGames as jest.Mock).mockResolvedValue(GAMES);
    });

    it('puts your move first, marked with a pawn, then the seeks', async () => {
      const { screen } = await renderList();

      expect(order(screen)).toEqual([
        'daily-game-mine',
        'daily-game-theirs',
        'daily-seek-seek-1',
      ]);
      expect(screen.getByTestId('daily-game-mine-your-move')).toBeTruthy();
      expect(screen.queryByTestId('daily-game-theirs-your-move')).toBeNull();
    });

    it('marks your move with a grey pawn, and no ring', async () => {
      const { screen } = await renderList();

      expect(screen.getByTestId('daily-game-mine-your-move').props.color).toBe(
        lightTheme.colors.textMuted,
      );
      const card = StyleSheet.flatten(
        screen.getByTestId('daily-game-mine').props.style,
      );
      expect(card.borderWidth).toBeUndefined();
    });

    it('fills each row with two cards', async () => {
      const { screen } = await renderList();
      const { width } = Dimensions.get('window');
      const cardWidth = (width - 2 * spacing.lg - spacing.md) / 2;

      for (const testID of ['daily-game-mine', 'daily-seek-seek-1']) {
        const card = StyleSheet.flatten(screen.getByTestId(testID).props.style);
        expect(card.width).toBe(cardWidth);
      }
    });

    it('moves the cards to a new order rather than drawing them again', async () => {
      const { screen } = await renderList();
      const board = screen.getByTestId('daily-game-mine-board');

      await fireEvent.press(screen.getByTestId('daily-games-sort-timeLeft'));

      expect(screen.getByTestId('daily-game-mine-board')).toBe(board);
    });

    it('sorts by time left', async () => {
      const { screen } = await renderList();

      // The menu starts open here (popoverMenuStartingOpen).
      await fireEvent.press(screen.getByTestId('daily-games-sort-timeLeft'));

      expect(order(screen).slice(0, 2)).toEqual([
        'daily-game-theirs',
        'daily-game-mine',
      ]);
    });

    it('shows only those on your move, with how many', async () => {
      const { screen } = await renderList();
      const filter = screen.getByTestId('daily-games-your-move-filter');
      expect(filter).toHaveTextContent('Your move 1');

      await fireEvent.press(filter);

      expect(order(screen)).toEqual(['daily-game-mine']);
    });
  });

  it('keeps the boards it hides drawn, to show them again at once', async () => {
    (getDailyGames as jest.Mock).mockResolvedValue([
      makeDailyGame({ id: 'mine', myTurn: true }),
      makeDailyGame({ id: 'theirs', myTurn: false }),
    ]);
    const { screen } = await renderList();
    const board = screen.getByTestId('daily-game-theirs-board');
    const filter = screen.getByTestId('daily-games-your-move-filter');

    await fireEvent.press(filter);
    expect(screen.queryByTestId('daily-game-theirs')).toBeNull();
    expect(screen.queryByTestId('daily-seek-seek-1')).toBeNull();
    await fireEvent.press(filter);

    expect(screen.getByTestId('daily-game-theirs-board')).toBe(board);
  });

  it('fetches the games and seeks again when pulled down', async () => {
    (getDailyGames as jest.Mock)
      .mockResolvedValueOnce([makeDailyGame({ id: 'old' })])
      .mockResolvedValue([makeDailyGame({ id: 'new' })]);
    const { screen } = await renderList();
    const seekFetches = (getMyDailySeeks as jest.Mock).mock.calls.length;

    const { refreshControl } = screen.getByTestId('daily-games-scroll').props;
    await act(async () => refreshControl.props.onRefresh());

    expect(screen.getByTestId('daily-game-new')).toBeTruthy();
    expect(getMyDailySeeks).toHaveBeenCalledTimes(seekFetches + 1);
    expect(
      screen.getByTestId('daily-games-scroll').props.refreshControl.props
        .refreshing,
    ).toBe(false);
  });

  it('says so with none', async () => {
    (getDailyGames as jest.Mock).mockResolvedValue([]);
    (getMyDailySeeks as jest.Mock).mockResolvedValue([]);
    const { screen } = await renderList();

    expect(screen.getByTestId('daily-games-empty')).toBeTruthy();
  });
});
