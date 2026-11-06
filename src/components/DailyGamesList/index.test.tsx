import { fireEvent, render, within } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import DailyGamesList from '.';
import { boardTester } from '../Board/boardTester';
import { DAILY_GAMES_STATUS } from '../../hooks/useDailyGames';
import { DailySeek } from '../../network/restClient';
import { makeDailyGame } from '../../testUtils/dailyGame';
import { lightTheme } from '../../theme';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const SEEK: DailySeek = {
  id: 'seek-1',
  days: 7,
  rated: false,
  ratingRange: null,
  color: 'random',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('DailyGamesList', () => {
  function renderList(
    overrides: Partial<React.ComponentProps<typeof DailyGamesList>> = {},
  ) {
    const props = {
      dailyGames: {
        status: DAILY_GAMES_STATUS.READY,
        games: [
          makeDailyGame({
            id: 'mine',
            moveDeadlineAt: new Date(Date.now() + DAY + 4 * HOUR).toISOString(),
          }),
          makeDailyGame({
            id: 'theirs',
            myTurn: false,
            playedAsWhite: false,
            opponent: {
              id: 'p2',
              username: 'hikaru',
              displayName: 'Hikaru',
              avatarColor: '#E8601C',
            },
            moveDeadlineAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          }),
        ],
      },
      seeks: [SEEK],
      onPressGame: jest.fn(),
      onCancelSeek: jest.fn(),
      onSeeAll: jest.fn(),
      ...overrides,
    } as React.ComponentProps<typeof DailyGamesList>;
    return { props, screenPromise: render(<DailyGamesList {...props} />) };
  }

  it('shows each game, in the order given, then the seeks still waiting', async () => {
    const { screenPromise } = renderList();
    const screen = await screenPromise;

    expect(
      screen
        .getAllByTestId(/^daily-(game-(mine|theirs)|seek-seek-1)$/)
        .map((card) => card.props.testID),
    ).toEqual(['daily-game-mine', 'daily-game-theirs', 'daily-seek-seek-1']);
    expect(
      screen.getByTestId('daily-games-section-see-all-count'),
    ).toHaveTextContent('2');
  });

  it('names each opponent with the time left on the move under it, and no rating', async () => {
    const { screenPromise } = renderList();
    const screen = await screenPromise;

    const mine = within(screen.getByTestId('daily-game-mine'));
    expect(mine.getByText('Judit')).toBeTruthy();
    expect(mine.getByTestId('daily-game-mine-time-left')).toHaveTextContent(
      '1 day 4h',
    );
    expect(mine.queryByText(/\d{4}/)).toBeNull();
    expect(screen.getByTestId('daily-game-theirs-time-left')).toHaveTextContent(
      '30m',
    );
  });

  it('shows the time left in red under 10 hours', async () => {
    const { screenPromise } = renderList({
      dailyGames: {
        status: DAILY_GAMES_STATUS.READY,
        games: [
          makeDailyGame({
            id: 'eleven',
            moveDeadlineAt: new Date(Date.now() + 11 * HOUR).toISOString(),
          }),
          makeDailyGame({
            id: 'nine',
            moveDeadlineAt: new Date(Date.now() + 9 * HOUR).toISOString(),
          }),
        ],
      },
    });
    const screen = await screenPromise;

    const color = (gameId: string) =>
      StyleSheet.flatten(
        screen.getByTestId(`daily-game-${gameId}-time-left`).props.style,
      ).color;
    expect(color('nine')).toBe(lightTheme.colors.danger);
    expect(color('eleven')).not.toBe(lightTheme.colors.danger);
  });

  it('draws each board from your side', async () => {
    const { screenPromise } = renderList();
    const screen = await screenPromise;

    const sideAtBottom = (gameId: string) =>
      boardTester(
        within(screen.getByTestId(`daily-game-${gameId}`)),
        'position',
      ).orientation();
    expect(sideAtBottom('mine')).toBe('w');
    expect(sideAtBottom('theirs')).toBe('b');
  });

  it('leaves the coordinates off its small boards', async () => {
    const { screenPromise } = renderList();
    const screen = await screenPromise;

    const card = within(screen.getByTestId('daily-game-mine'));
    expect(card.queryByText('a')).toBeNull();
    expect(card.queryByText('8')).toBeNull();
  });

  it("greys out the board of a game on the opponent's move", async () => {
    const { screenPromise } = renderList();
    const screen = await screenPromise;

    const opacity = (gameId: string) =>
      StyleSheet.flatten(
        screen.getByTestId(`daily-game-${gameId}-board`).props.style,
      )?.opacity ?? 1;
    expect(opacity('mine')).toBe(1);
    expect(opacity('theirs')).toBeLessThan(1);
  });

  it('opens a game, and withdraws a seek', async () => {
    const { props, screenPromise } = renderList();
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('daily-game-theirs'));
    await fireEvent.press(screen.getByTestId('daily-seek-seek-1-cancel'));

    expect(props.onPressGame).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'theirs' }),
    );
    expect(props.onCancelSeek).toHaveBeenCalledWith(SEEK);
  });

  it('opens every game from See All', async () => {
    const { props, screenPromise } = renderList();
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('daily-games-section-see-all'));

    expect(props.onSeeAll).toHaveBeenCalled();
  });

  it('says what a seek is for', async () => {
    const { screenPromise } = renderList();
    const screen = await screenPromise;

    const seek = within(screen.getByTestId('daily-seek-seek-1'));
    expect(seek.getByText('Finding opponent')).toBeTruthy();
    expect(seek.getByText('7 days · Casual')).toBeTruthy();
  });

  it('shows nothing with no game or seek', async () => {
    const { screenPromise } = renderList({
      dailyGames: { status: DAILY_GAMES_STATUS.READY, games: [] },
      seeks: [],
    });
    const screen = await screenPromise;

    expect(screen.queryByTestId('daily-games-section')).toBeNull();
  });

  it('shows a skeleton of cards while the games load', async () => {
    const { screenPromise } = renderList({
      dailyGames: { status: DAILY_GAMES_STATUS.LOADING },
    });
    const screen = await screenPromise;

    expect(screen.getByTestId('daily-games-section-loading')).toBeTruthy();
    expect(screen.queryByTestId('daily-games-section')).toBeNull();
  });

  it("shows nothing when the games couldn't be loaded", async () => {
    const { screenPromise } = renderList({
      dailyGames: { status: DAILY_GAMES_STATUS.ERROR },
    });
    const screen = await screenPromise;

    expect(screen.queryByTestId('daily-games-section-loading')).toBeNull();
    expect(screen.queryByTestId('daily-games-section')).toBeNull();
  });
});
