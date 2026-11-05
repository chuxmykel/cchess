import { act, fireEvent, render } from '@testing-library/react-native';
import { Color } from 'chess.js';

import DailyGameContent, {
  DailyGameContentNavigation,
} from './DailyGameContent';
import { OnlineChessGameProvider } from '../../context/LiveGame/OnlineChessGameContext';
import { DAILY_SEEK_QUEUED_MESSAGE } from '../../constants/seek';
import { GAME_RESULT_REASON, GameSnapshot } from '../../network/socketEvents';
import { createFakeSocket } from '../../testUtils/fakeSocket';
import { makeGameSnapshot } from '../../testUtils/gameSnapshot';
import { makeDailyGame } from '../../testUtils/dailyGame';
import { withSafeArea } from '../../testUtils/safeArea';
import { waitForSheetToClose } from '../../testUtils/modal';
import { DailyGame } from '../../network/restClient';
import { boardTester } from '../../components/Board/boardTester';
import { settleAnimations } from '../../testUtils/pieceGestures';

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

let mockDailyGames: DailyGame[] = [];
jest.mock('../../hooks/useDailyGames', () => ({
  ...jest.requireActual('../../hooks/useDailyGames'),
  useDailyGames: () => ({
    dailyGames: { status: 'ready', games: mockDailyGames },
    reload: jest.fn(),
  }),
}));
const mockSeekDailyGame = jest.fn();
jest.mock('../../hooks/useSeekDailyGame', () => ({
  useSeekDailyGame: () => mockSeekDailyGame,
}));

const DAY_MS = 24 * 60 * 60 * 1000;
const AFTER_E4_E5 =
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';

function dailySnapshot(
  overrides: Partial<ReturnType<typeof makeGameSnapshot>> = {},
) {
  return makeGameSnapshot({
    id: 'this-game',
    gameType: 'daily',
    initialSeconds: 3 * 24 * 60 * 60,
    incrementSeconds: 0,
    daysPerMove: 3,
    rated: true,
    whiteTimeRemainingMs: 2 * DAY_MS + 4 * 60 * 60 * 1000,
    blackTimeRemainingMs: 3 * DAY_MS,
    ...overrides,
  });
}

/** Both sides have moved, so the game can no longer be aborted. */
const UNDER_WAY: Partial<GameSnapshot> = {
  fen: AFTER_E4_E5,
  moves: [
    {
      ply: 1,
      from: 'e2',
      to: 'e4',
      piece: 'p',
      color: 'w',
      san: 'e4',
      captured: null,
      promotion: null,
      fenAfter: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      clockAfterMs: 3 * DAY_MS,
    },
    {
      ply: 2,
      from: 'e7',
      to: 'e5',
      piece: 'p',
      color: 'b',
      san: 'e5',
      captured: null,
      promotion: null,
      fenAfter: AFTER_E4_E5,
      clockAfterMs: 3 * DAY_MS,
    },
  ],
};

describe('DailyGameContent', () => {
  afterEach(() => {
    jest.clearAllMocks();
    mockDailyGames = [];
  });

  async function renderContent(
    myColor: Color = 'w',
    overrides: Partial<ReturnType<typeof makeGameSnapshot>> = {},
    { confirmMoves = false } = {},
  ) {
    const { socket, trigger } = createFakeSocket();
    const snapshot = dailySnapshot(overrides);
    const navigation: DailyGameContentNavigation = {
      navigate: jest.fn(),
      replace: jest.fn(),
      goBack: jest.fn(),
    };
    const onMessage = jest.fn();
    const screen = await render(
      withSafeArea(
        <OnlineChessGameProvider
          socket={socket}
          gameId={snapshot.id}
          myColor={myColor}
          snapshot={snapshot}
          options={{ confirmMoves }}
        >
          <DailyGameContent
            width={400}
            navigation={navigation}
            snapshot={snapshot}
            onMessage={onMessage}
          />
        </OnlineChessGameProvider>,
      ),
    );
    return { screen, socket, snapshot, trigger, navigation, onMessage };
  }

  type Screen = Awaited<ReturnType<typeof renderContent>>['screen'];

  async function chooseMenuAction(screen: Screen, testID: string) {
    await fireEvent.press(screen.getByTestId('game-menu-button'));
    await fireEvent.press(screen.getByTestId(testID));
    await waitForSheetToClose();
  }

  function menuActionIds(screen: Screen) {
    return screen
      .getAllByTestId(/-action$/)
      .map((action) => action.props.testID);
  }

  it("shows each side's clock as the days and hours left on the move", async () => {
    const { screen } = await renderContent();

    expect(screen.getByTestId('game-clock-White')).toHaveTextContent(
      '2 days 4h',
    );
    expect(screen.getByTestId('game-clock-Black')).toHaveTextContent('3 days');
  });

  it('can always be left, the game going on', async () => {
    const { screen, navigation } = await renderContent();

    await fireEvent.press(screen.getByTestId('game-header-back'));

    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('offers the next game, a draw, resigning and flipping the board', async () => {
    const { screen } = await renderContent('w', UNDER_WAY);

    await fireEvent.press(screen.getByTestId('game-menu-button'));

    expect(menuActionIds(screen)).toEqual([
      'next-game-action',
      'offer-draw-action',
      'resign-action',
      'daily-game-settings-action',
      'flip-board-action',
    ]);
  });

  it('offers to abort rather than resign or draw before both sides have moved', async () => {
    const { screen } = await renderContent();

    await fireEvent.press(screen.getByTestId('game-menu-button'));

    expect(menuActionIds(screen)).toEqual([
      'next-game-action',
      'abort-game-action',
      'daily-game-settings-action',
      'flip-board-action',
    ]);
  });

  it('opens the daily game settings', async () => {
    const { screen, navigation } = await renderContent();

    await chooseMenuAction(screen, 'daily-game-settings-action');

    expect(navigation.navigate).toHaveBeenCalledWith('DailyGameSettings');
  });

  describe('with moves confirmed', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    function sentMoves(socket: { emit: jest.Mock | unknown }) {
      return (socket.emit as jest.Mock).mock.calls.filter(
        ([event]) => event === 'game:move',
      );
    }

    async function playE4(screen: Screen) {
      await boardTester(screen).taps('e2', 'e4');
      await settleAnimations();
    }

    it('holds a move on the board until it is confirmed, then sends it', async () => {
      const { screen, socket } = await renderContent(
        'w',
        {},
        {
          confirmMoves: true,
        },
      );

      await playE4(screen);

      expect(boardTester(screen).pieceOn('e4')).toBe('wp');
      expect(sentMoves(socket)).toEqual([]);
      expect(screen.queryByTestId('game-toolbar')).toBeNull();

      await fireEvent.press(screen.getByTestId('confirm-move-button'));

      expect(sentMoves(socket)).toEqual([
        ['game:move', { gameId: 'this-game', from: 'e2', to: 'e4' }],
      ]);
      expect(screen.queryByTestId('confirm-move-bar')).toBeNull();
      expect(screen.getByTestId('game-toolbar')).toBeTruthy();
    });

    it('takes a move back when it is cancelled, sending nothing', async () => {
      const { screen, socket } = await renderContent(
        'w',
        {},
        {
          confirmMoves: true,
        },
      );

      await playE4(screen);
      await fireEvent.press(screen.getByTestId('cancel-move-button'));
      await settleAnimations();

      expect(boardTester(screen).pieceOn('e2')).toBe('wp');
      expect(boardTester(screen).pieceOn('e4')).toBeNull();
      expect(sentMoves(socket)).toEqual([]);
      expect(screen.getByTestId('game-toolbar')).toBeTruthy();
    });

    it('sends a move at once with moves not confirmed', async () => {
      const { screen, socket } = await renderContent();

      await playE4(screen);

      expect(sentMoves(socket)).toHaveLength(1);
      expect(screen.queryByTestId('confirm-move-bar')).toBeNull();
    });
  });

  it('goes to the next game in the list', async () => {
    mockDailyGames = [
      makeDailyGame({ id: 'this-game' }),
      makeDailyGame({ id: 'next-game' }),
    ];
    const { screen, navigation } = await renderContent();

    await chooseMenuAction(screen, 'next-game-action');

    expect(navigation.replace).toHaveBeenCalledWith('DailyGame', {
      gameId: 'next-game',
    });
  });

  it("says so when there's no other game to go to", async () => {
    mockDailyGames = [makeDailyGame({ id: 'this-game' })];
    const { screen, navigation, onMessage } = await renderContent();

    await chooseMenuAction(screen, 'next-game-action');

    expect(navigation.replace).not.toHaveBeenCalled();
    expect(onMessage).toHaveBeenCalledWith(
      'This is your only daily game in progress.',
    );
  });

  it('offers a draw, and accepts one offered', async () => {
    const { screen, socket, trigger } = await renderContent('w', UNDER_WAY);

    await chooseMenuAction(screen, 'offer-draw-action');
    expect(socket.emit).toHaveBeenCalledWith('game:drawOffer', {
      gameId: 'this-game',
    });

    await act(() =>
      trigger('game:drawOffered', { gameId: 'this-game', by: 'black' }),
    );
    await chooseMenuAction(screen, 'accept-draw-action');
    expect(socket.emit).toHaveBeenCalledWith('game:drawRespond', {
      gameId: 'this-game',
      accept: true,
    });
  });

  describe('once over', () => {
    async function finish(trigger: (event: string, payload: unknown) => void) {
      await act(() =>
        trigger(
          'game:over',
          dailySnapshot({
            ...UNDER_WAY,
            status: 'completed',
            result: 'white',
            resultReason: GAME_RESULT_REASON.RESIGNATION,
          }),
        ),
      );
    }

    it('seeks another daily game of the same days against someone new', async () => {
      mockSeekDailyGame.mockResolvedValue({ status: 'queued' });
      const { screen, trigger, onMessage } = await renderContent(
        'w',
        UNDER_WAY,
      );
      await finish(trigger);

      await fireEvent.press(screen.getByTestId('new-opponent-button'));

      expect(mockSeekDailyGame).toHaveBeenCalledWith(
        expect.objectContaining({ days: 3, rated: true }),
      );
      expect(onMessage).toHaveBeenCalledWith(DAILY_SEEK_QUEUED_MESSAGE);
    });

    it('opens the new game when a seek was waiting for it', async () => {
      mockSeekDailyGame.mockResolvedValue({
        status: 'matched',
        gameId: 'new-game',
      });
      const { screen, trigger, navigation } = await renderContent(
        'w',
        UNDER_WAY,
      );
      await finish(trigger);

      await fireEvent.press(screen.getByTestId('new-opponent-button'));

      expect(navigation.replace).toHaveBeenCalledWith('DailyGame', {
        gameId: 'new-game',
      });
    });

    it('offers the next game and the analysis board from the menu', async () => {
      const { screen, trigger } = await renderContent('w', UNDER_WAY);
      await finish(trigger);
      await fireEvent.press(screen.getByTestId('game-over-dismiss'));

      await fireEvent.press(screen.getByTestId('game-menu-button'));

      expect(menuActionIds(screen)).toEqual([
        'next-game-action',
        'show-result-action',
        'analyse-action',
        'daily-game-settings-action',
        'flip-board-action',
      ]);
    });
  });
});
