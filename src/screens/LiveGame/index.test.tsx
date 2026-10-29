import { act, fireEvent, render } from '@testing-library/react-native';

import LiveGame from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { DEFAULT_TIME_CONTROL } from '../../constants/timeControls';
import { Seek } from '../../constants/seek';
import { AccountUser } from '../../network/restClient';
import { GAME_RESULT_REASON } from '../../network/socketEvents';
import { createFakeSocket } from '../../testUtils/fakeSocket';
import { makeGameSnapshot } from '../../testUtils/gameSnapshot';
import { withSafeArea } from '../../testUtils/safeArea';
import { makeAuthSession } from '../../testUtils/authSession';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../hooks/useGameBookmark', () => ({
  useGameBookmark: () => ({ isBookmarked: false, toggleBookmark: jest.fn() }),
}));
jest.mock('../../components/ConnectionStrengthIndicator', () =>
  jest.requireActual('../../testUtils/ConnectionStrengthIndicatorStub'),
);

const AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
const APP_PLAYER_ID = makeGameSnapshot().white.id;
const RATED_SEEK: Seek = {
  timeControl: DEFAULT_TIME_CONTROL,
  rated: true,
  ratingRange: { below: 200, above: 500 },
};
const SIGNED_IN_USER: Partial<AccountUser> = {
  isGuest: false,
  ratings: [
    { category: 'bullet', rating: 1100, gamesPlayed: 3, provisional: true },
    { category: 'blitz', rating: 1650, gamesPlayed: 40, provisional: false },
  ],
};

describe('LiveGame', () => {
  function renderScreen(
    params: Parameters<typeof LiveGame>[0]['route']['params'],
    user: Partial<AccountUser> = {},
  ) {
    const { socket, trigger } = createFakeSocket();
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ socket, user: { id: APP_PLAYER_ID, ...user } }),
    );
    const navigation = {
      goBack: jest.fn(),
      setOptions: jest.fn(),
      popToTop: jest.fn(),
    };
    const props = {
      navigation,
      route: { key: 'LiveGame', name: 'LiveGame', params },
    } as unknown as Parameters<typeof LiveGame>[0];
    return {
      screenPromise: render(withSafeArea(<LiveGame {...props} />)),
      socket,
      trigger,
      navigation,
    };
  }

  function seekCount(socket: ReturnType<typeof createFakeSocket>['socket']) {
    return (socket.emit as jest.Mock).mock.calls.filter(
      ([event]) => event === 'matchmaking:seek',
    ).length;
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('seeks an opponent first, on the waiting screen', async () => {
    const { screenPromise, socket } = renderScreen({
      seek: RATED_SEEK,
    });
    const screen = await screenPromise;

    expect(screen.getByTestId('seeking-content')).toBeTruthy();
    expect(seekCount(socket)).toBe(1);
  });

  it('starts the matched game in place, without navigating', async () => {
    const { screenPromise, socket, trigger, navigation } = renderScreen({
      seek: RATED_SEEK,
    });
    const screen = await screenPromise;

    await act(() =>
      trigger('game:created', makeGameSnapshot({ id: 'game-1' })),
    );

    expect(screen.queryByTestId('seeking-content')).toBeNull();
    expect(screen.getByTestId('live-game-skeleton')).toBeTruthy();
    expect(socket.emit).toHaveBeenCalledWith('game:join', { gameId: 'game-1' });

    await act(() => trigger('game:state', makeGameSnapshot({ id: 'game-1' })));

    expect(screen.getByTestId('game-toolbar')).toBeTruthy();
    expect(screen.getByTestId('piece-e2')).toBeTruthy();
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('goes back to seeking for a new opponent, then starts the next game fresh', async () => {
    const { screenPromise, socket, trigger } = renderScreen({
      seek: RATED_SEEK,
    });
    const screen = await screenPromise;
    const firstGame = makeGameSnapshot({ id: 'game-1' });
    await act(() => trigger('game:created', firstGame));
    await act(() => trigger('game:state', firstGame));
    await act(() =>
      trigger('game:move', {
        gameId: 'game-1',
        move: {
          ply: 1,
          from: 'e2',
          to: 'e4',
          piece: 'p',
          color: 'w',
          san: 'e4',
          captured: null,
          promotion: null,
          fenAfter: AFTER_E4,
          clockAfterMs: 300000,
        },
        fen: AFTER_E4,
        turn: 'b',
        whiteTimeRemainingMs: 300000,
        blackTimeRemainingMs: 300000,
      }),
    );
    await act(() =>
      trigger('game:over', {
        ...firstGame,
        status: 'completed',
        result: 'white',
        resultReason: GAME_RESULT_REASON.RESIGNATION,
      }),
    );

    await fireEvent.press(screen.getByTestId('new-opponent-button'));

    expect(screen.getByTestId('seeking-content')).toBeTruthy();
    expect(seekCount(socket)).toBe(2);

    const secondGame = makeGameSnapshot({ id: 'game-2' });
    await act(() => trigger('game:created', secondGame));
    await act(() => trigger('game:state', secondGame));

    expect(screen.getByTestId('piece-e2')).toBeTruthy();
    expect(screen.queryByTestId('piece-e4')).toBeNull();
  });

  it('leaves the screen when the seek is cancelled', async () => {
    const { screenPromise, navigation } = renderScreen({
      seek: RATED_SEEK,
    });
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('matchmaking-cancel-button'));

    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('shows the matchmaking error and leaves the screen', async () => {
    const { screenPromise, trigger, navigation } = renderScreen({
      seek: RATED_SEEK,
    });
    const screen = await screenPromise;

    await act(() =>
      trigger('matchmaking:error', { message: 'No opponents available' }),
    );

    expect(screen.getByText('No opponents available')).toBeTruthy();
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('allows swiping back until the game has loaded, then locks it', async () => {
    const { screenPromise, trigger, navigation } = renderScreen({
      seek: RATED_SEEK,
    });
    await screenPromise;
    expect(navigation.setOptions).toHaveBeenLastCalledWith({
      gestureEnabled: true,
    });

    await act(() =>
      trigger('game:created', makeGameSnapshot({ id: 'game-1' })),
    );
    expect(navigation.setOptions).toHaveBeenLastCalledWith({
      gestureEnabled: true,
    });

    await act(() => trigger('game:state', makeGameSnapshot({ id: 'game-1' })));
    expect(navigation.setOptions).toHaveBeenLastCalledWith({
      gestureEnabled: false,
    });
  });

  it('seeks a rated game with your rating range when signed in', async () => {
    const { screenPromise, socket } = renderScreen(
      { seek: RATED_SEEK },
      SIGNED_IN_USER,
    );
    const screen = await screenPromise;

    expect(socket.emit).toHaveBeenCalledWith('matchmaking:seek', {
      initialSeconds: DEFAULT_TIME_CONTROL.initialSeconds,
      incrementSeconds: DEFAULT_TIME_CONTROL.incrementSeconds,
      rated: true,
      ratingRange: { below: 200, above: 500 },
      color: 'random',
    });
    expect(
      screen.getByText(`${DEFAULT_TIME_CONTROL.label} • Rated`),
    ).toBeTruthy();
    expect(screen.getByText('1450–2150')).toBeTruthy();
  });

  it('refreshes your rating for the rating range each time it seeks', async () => {
    const { screenPromise } = renderScreen(
      { seek: RATED_SEEK },
      SIGNED_IN_USER,
    );
    await screenPromise;

    const session = (useAuthSession as jest.Mock).mock.results[0].value;
    expect(session.reloadUser).toHaveBeenCalledTimes(1);
  });

  it("doesn't refresh a guest's rating, since guests have none", async () => {
    const { screenPromise } = renderScreen({ seek: RATED_SEEK });
    await screenPromise;

    const session = (useAuthSession as jest.Mock).mock.results[0].value;
    expect(session.reloadUser).not.toHaveBeenCalled();
  });

  it('shows the lobby stats the server sends while seeking', async () => {
    const { screenPromise, trigger } = renderScreen({ seek: RATED_SEEK });
    const screen = await screenPromise;

    await act(() =>
      trigger('lobby:stats', { playersOnline: 7, gamesInPlay: 2 }),
    );

    expect(screen.getByText('7 players online')).toBeTruthy();
    expect(screen.getByText('2 games in play')).toBeTruthy();
  });

  it('shows a guest seek as casual, with no rating range', async () => {
    const { screenPromise } = renderScreen({ seek: RATED_SEEK });
    const screen = await screenPromise;

    expect(
      screen.getByText(`${DEFAULT_TIME_CONTROL.label} • Casual`),
    ).toBeTruthy();
    expect(screen.queryByTestId('seek-card-rating-range')).toBeNull();
  });

  it('shows the time control it was seeking while the game loads', async () => {
    const { screenPromise, trigger } = renderScreen({
      seek: RATED_SEEK,
    });
    const screen = await screenPromise;

    await act(() =>
      trigger('game:created', makeGameSnapshot({ id: 'game-1' })),
    );

    expect(screen.getByTestId('live-game-skeleton')).toBeTruthy();
    expect(
      screen.getByText(`${DEFAULT_TIME_CONTROL.label} • Casual`),
    ).toBeTruthy();
  });

  it('opens an existing game directly when given one', async () => {
    const { screenPromise, socket } = renderScreen({ gameId: 'game-1' });
    const screen = await screenPromise;

    expect(screen.queryByTestId('seeking-content')).toBeNull();
    expect(seekCount(socket)).toBe(0);
    expect(socket.emit).toHaveBeenCalledWith('game:join', { gameId: 'game-1' });
  });

  it('plays a rematch in place once both players agree, colors swapped', async () => {
    const { screenPromise, socket, trigger } = renderScreen({
      gameId: 'game-1',
    });
    const screen = await screenPromise;
    const first = makeGameSnapshot({
      id: 'game-1',
      status: 'completed',
      result: 'white',
      resultReason: 'resignation',
    });
    await act(() => trigger('game:state', first));

    await fireEvent.press(screen.getByTestId('rematch-button'));
    expect(socket.emit).toHaveBeenCalledWith('game:rematchOffer', {
      gameId: 'game-1',
    });

    const rematch = makeGameSnapshot({
      id: 'game-2',
      white: first.black,
      black: first.white,
      rematchOfId: 'game-1',
      series: { white: 0, black: 1 },
    });
    await act(() => trigger('game:created', rematch));
    expect(socket.emit).toHaveBeenCalledWith('game:join', { gameId: 'game-2' });
    await act(() => trigger('game:state', rematch));

    expect(screen.queryByTestId('game-over-card')).toBeNull();
    expect(screen.getByTestId('series-points-b')).toHaveTextContent('1');
    expect(screen.getByTestId('series-points-w')).toHaveTextContent('0');
  });
});
