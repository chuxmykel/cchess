import { act, fireEvent, render, within } from '@testing-library/react-native';

import GameViewer from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { getGame } from '../../network/restClient';
import { GameMoveSummary, GameSnapshot } from '../../network/socketEvents';
import { makeAuthSession } from '../../testUtils/authSession';
import { createFakeSocket } from '../../testUtils/fakeSocket';
import { makeGameSnapshot } from '../../testUtils/gameSnapshot';
import { withSafeArea } from '../../testUtils/safeArea';
import { waitForSheetToClose } from '../../testUtils/modal';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getGame: jest.fn(),
}));
jest.mock('../../components/ConnectionStrengthIndicator', () =>
  jest.requireActual('../../testUtils/ConnectionStrengthIndicatorStub'),
);
jest.mock('../../hooks/useGameClock', () =>
  jest.requireActual('../../testUtils/gameClockStandingStill'),
);
jest.mock('../../hooks/useGameShare', () => ({
  useGameShare: () => jest.fn(),
}));
jest.mock('../../hooks/useGameBookmark', () => ({
  useGameBookmark: () => ({ isBookmarked: false, toggleBookmark: jest.fn() }),
}));

function move(
  ply: number,
  san: string,
  fenAfter: string,
  clockAfterMs: number,
  captured: GameMoveSummary['captured'] = null,
): GameMoveSummary {
  return {
    ply,
    from: 'e2',
    to: 'e4',
    piece: 'p',
    color: ply % 2 === 1 ? 'w' : 'b',
    san,
    captured,
    promotion: null,
    fenAfter,
    clockAfterMs,
  };
}

const AFTER_EXD5 = 'rnbqkbnr/ppp1pppp/8/3P4/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2';
const MOVES = [
  move(
    1,
    'e4',
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    298000,
  ),
  move(
    2,
    'd5',
    'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    295000,
  ),
  move(3, 'exd5', AFTER_EXD5, 290000, 'p'),
];

function finishedGame(overrides: Partial<GameSnapshot> = {}): GameSnapshot {
  return makeGameSnapshot({
    status: 'completed',
    result: 'white',
    resultReason: 'resignation',
    fen: AFTER_EXD5,
    turn: 'b',
    moves: MOVES,
    whiteTimeRemainingMs: 290000,
    blackTimeRemainingMs: 280000,
    endedAt: '2026-10-27T10:05:00.000Z',
    chatClosesAt: new Date(Date.now() + 60_000).toISOString(),
    ...overrides,
  });
}

describe('GameViewer', () => {
  async function renderScreen(
    snapshot: GameSnapshot,
    userId = snapshot.white.id,
  ) {
    const fake = createFakeSocket();
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({
        user: { id: userId, isGuest: false },
        socket: fake.socket,
      }),
    );
    (getGame as jest.Mock).mockResolvedValue(snapshot);
    const navigation = {
      navigate: jest.fn(),
      replace: jest.fn(),
      goBack: jest.fn(),
    };
    const screen = await render(
      withSafeArea(
        <GameViewer
          navigation={navigation as never}
          route={{
            key: 'k',
            name: 'GameViewer',
            params: { gameId: snapshot.id },
          }}
        />,
      ),
    );
    await act(async () => {});
    return { screen, navigation, socket: fake.socket };
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows my result over the final position, until dismissed', async () => {
    const { screen } = await renderScreen(finishedGame());

    expect(screen.getByText('You won')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('game-over-dismiss'));
    expect(screen.queryByTestId('game-over-card')).toBeNull();
  });

  it("opens a player's profile from their name", async () => {
    const snapshot = finishedGame();
    const { screen, navigation } = await renderScreen(snapshot);

    await fireEvent.press(screen.getByTestId('player-name-b'));

    expect(navigation.navigate).toHaveBeenCalledWith('UserProfile', {
      username: snapshot.black.username,
    });
  });

  it('steps back through the moves, with the clocks and material of each', async () => {
    const { screen } = await renderScreen(finishedGame());
    const whiteBar = () => within(screen.getByTestId('player-bar-w'));
    expect(whiteBar().getByText('4:50')).toBeTruthy();
    expect(whiteBar().getByTestId('material-score-w')).toHaveTextContent('+1');

    await fireEvent.press(screen.getByTestId('previous-move-button'));

    expect(whiteBar().getByText('4:58')).toBeTruthy();
    expect(whiteBar().queryByTestId('material-score-w')).toBeNull();
    expect(screen.queryByTestId('game-over-card')).toBeNull();
  });

  it("names the winner of a game I didn't play, without a chat", async () => {
    const { screen } = await renderScreen(finishedGame(), 'someone-else');

    expect(screen.getByText('White won')).toBeTruthy();
    expect(screen.queryByTestId('chat-button')).toBeNull();
  });

  it('opens my own game in progress on the live game screen', async () => {
    const { navigation } = await renderScreen(makeGameSnapshot());

    expect(navigation.replace).toHaveBeenCalledWith('LiveGame', {
      gameId: 'game-1',
    });
  });

  it("watches someone else's game in progress", async () => {
    const { screen, socket } = await renderScreen(
      makeGameSnapshot(),
      'someone-else',
    );

    expect(socket.emit).toHaveBeenCalledWith('game:watch', {
      gameId: 'game-1',
    });
    expect(screen.getByTestId('game-header-subtitle')).toHaveTextContent(
      'Playing now',
    );
  });

  it('finds a new opponent at the same time control', async () => {
    const { screen, navigation } = await renderScreen(finishedGame());

    await fireEvent.press(screen.getByTestId('new-opponent-button'));

    expect(navigation.navigate).toHaveBeenCalledWith('LiveGame', {
      seek: expect.objectContaining({
        timeControl: expect.objectContaining({
          initialSeconds: 300,
          incrementSeconds: 0,
        }),
      }),
    });
  });

  it('offers my own game at that time control after one I only watched', async () => {
    const { screen, navigation } = await renderScreen(
      finishedGame(),
      'someone-else',
    );

    expect(screen.getByTestId('new-opponent-button')).toHaveTextContent(
      'Play 5+0',
    );
    await fireEvent.press(screen.getByTestId('game-menu-button'));
    expect(screen.getByTestId('new-opponent-action')).toHaveTextContent(
      'Play 5+0',
    );
    await fireEvent.press(screen.getByTestId('new-opponent-button'));
    expect(navigation.navigate).toHaveBeenCalledWith('LiveGame', {
      seek: expect.objectContaining({
        timeControl: expect.objectContaining({ initialSeconds: 300 }),
      }),
    });
  });

  it('offers a new opponent after a game I played', async () => {
    const { screen } = await renderScreen(finishedGame());

    expect(screen.getByTestId('new-opponent-button')).toHaveTextContent(
      'New opponent',
    );
  });

  it('lets me keep chatting after the game, until the chat closes', async () => {
    const { screen, socket } = await renderScreen(finishedGame());
    await fireEvent.press(screen.getByTestId('chat-button'));
    await fireEvent.changeText(screen.getByTestId('chat-input'), 'gg');
    await fireEvent.press(screen.getByTestId('chat-send-button'));
    expect(socket.emit).toHaveBeenCalledWith('game:chat', {
      gameId: 'game-1',
      text: 'gg',
    });
    await waitForSheetToClose();
  });

  it('shows the chat as closed once the window has passed', async () => {
    const { screen } = await renderScreen(
      finishedGame({ chatClosesAt: '2026-01-01T00:00:00.000Z' }),
    );

    await fireEvent.press(screen.getByTestId('chat-button'));

    expect(screen.getByTestId('chat-closed')).toBeTruthy();
  });

  it('offers to retry a game that fails to load', async () => {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
    (getGame as jest.Mock).mockRejectedValue(new Error('offline'));
    const screen = await render(
      withSafeArea(
        <GameViewer
          navigation={{ goBack: jest.fn() } as never}
          route={{ key: 'k', name: 'GameViewer', params: { gameId: 'gone' } }}
        />,
      ),
    );
    await act(async () => {});

    expect(screen.getByTestId('game-viewer-error')).toBeTruthy();
  });
});
