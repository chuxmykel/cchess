import { act, fireEvent, render, within } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { Color } from 'chess.js';

import LiveGameContent, { LiveGameContentNavigation } from './LiveGameContent';
import { OnlineChessGameProvider } from '../../context/LiveGame/OnlineChessGameContext';
import { NUMBER_OF_ROWS } from '../../constants';
import {
  GAME_RESULT_REASON,
  GameMoveSummary,
} from '../../network/socketEvents';
import { createFakeSocket } from '../../testUtils/fakeSocket';
import { makeGameSnapshot } from '../../testUtils/gameSnapshot';
import { findTimeControl } from '../../constants/timeControls';
import { withSafeArea } from '../../testUtils/safeArea';
import { waitForSheetToClose } from '../../testUtils/modal';

jest.mock('../../components/ConnectionStrengthIndicator', () =>
  jest.requireActual('../../testUtils/ConnectionStrengthIndicatorStub'),
);

const mockShareGame = jest.fn();
jest.mock('../../hooks/useGameShare', () => ({
  useGameShare: () => mockShareGame,
}));

const mockBookmark = { isBookmarked: false, toggleBookmark: jest.fn() };
jest.mock('../../hooks/useGameBookmark', () => ({
  useGameBookmark: () => mockBookmark,
}));

jest.mock('../../hooks/usePopoverMenu', () =>
  jest.requireActual('../../testUtils/popoverMenuStartingOpen'),
);

const AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
const AFTER_E5 = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';

describe('LiveGameContent', () => {
  const width = 400;
  const PIECE_WIDTH = width / NUMBER_OF_ROWS;
  const BOTTOM_ROW_Y = (NUMBER_OF_ROWS - 1) * PIECE_WIDTH;
  const WHITE_PLAYER_BAR = 'player-bar-w';
  const BLACK_PLAYER_BAR = 'player-bar-b';

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  async function renderContent(
    myColor: Color,
    snapshotOverrides: Partial<ReturnType<typeof makeGameSnapshot>> = {},
  ) {
    const { socket, trigger } = createFakeSocket();
    const snapshot = makeGameSnapshot(snapshotOverrides);
    const navigation: LiveGameContentNavigation = {
      setOptions: jest.fn(),
      popToTop: jest.fn(),
      navigate: jest.fn(),
    };
    const onNewOpponent = jest.fn();
    const screen = await render(
      withSafeArea(
        <OnlineChessGameProvider
          socket={socket}
          gameId={snapshot.id}
          myColor={myColor}
          snapshot={snapshot}
        >
          <LiveGameContent
            width={width}
            navigation={navigation}
            snapshot={snapshot}
            onNewOpponent={onNewOpponent}
          />
        </OnlineChessGameProvider>,
      ),
    );
    return { screen, socket, snapshot, trigger, navigation, onNewOpponent };
  }

  type Screen = Awaited<ReturnType<typeof renderContent>>['screen'];

  function playerBarOrder(screen: Screen) {
    return screen.getAllByTestId(/^player-bar-/).map((bar) => bar.props.testID);
  }

  function translateYOf(element: { props: Record<string, any> }) {
    return element.props.style.transform[1].translateY;
  }

  async function openGameMenu(screen: Screen) {
    await fireEvent.press(screen.getByTestId('game-menu-button'));
  }

  async function chooseMenuAction(screen: Screen, testID: string) {
    await fireEvent.press(screen.getByTestId(testID));
    await waitForSheetToClose();
  }

  async function flipViaMenu(screen: Screen) {
    await openGameMenu(screen);
    await chooseMenuAction(screen, 'flip-board-action');
  }

  function moveSummary(
    ply: number,
    from: string,
    to: string,
    fenAfter: string,
  ): GameMoveSummary {
    return {
      ply,
      from: from as GameMoveSummary['from'],
      to: to as GameMoveSummary['to'],
      piece: 'p',
      color: ply % 2 === 1 ? 'w' : 'b',
      san: to,
      captured: null,
      promotion: null,
      fenAfter,
      clockAfterMs: 300000,
    };
  }

  function pushMove(
    trigger: (event: string, payload: unknown) => void,
    gameId: string,
    move: GameMoveSummary,
  ) {
    trigger('game:move', {
      gameId,
      move,
      fen: move.fenAfter,
      turn: move.color === 'w' ? 'b' : 'w',
      whiteTimeRemainingMs: 300000,
      blackTimeRemainingMs: 300000,
    });
  }

  /** 1. e4 e5 - after which a draw can be offered. */
  function playFirstMoves(
    trigger: (event: string, payload: unknown) => void,
    gameId: string,
  ) {
    pushMove(trigger, gameId, moveSummary(1, 'e2', 'e4', AFTER_E4));
    pushMove(trigger, gameId, moveSummary(2, 'e7', 'e5', AFTER_E5));
  }

  it('tells the side to move how long it has to play its first move', async () => {
    const now = Date.parse('2026-10-27T12:00:00Z');
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const deadline = new Date(now + 25_500).toISOString();
    const { screen } = await renderContent('w', {
      firstMoveDeadline: deadline,
    });

    expect(
      await screen.findByText('26 seconds to play the first move'),
    ).toBeTruthy();
    expect(screen.queryByTestId('first-move-countdown-b')).toBeNull();
  });

  it('shows the material each side is up beside its name', async () => {
    const { screen } = await renderContent('w', {
      fen: 'rnbqkbnr/ppp1pppp/8/3P4/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2',
      turn: 'b',
    });

    expect(screen.getByTestId('material-score-w')).toHaveTextContent('+1');
    expect(screen.queryByTestId('captured-pieces-b')).toBeNull();
  });

  it("opens a player's profile from their name", async () => {
    const { screen, navigation } = await renderContent('w');

    await fireEvent.press(screen.getByTestId('player-name-b'));

    expect(navigation.navigate).toHaveBeenCalledWith('UserProfile', {
      username: 'black',
    });
  });

  it("shows only the opponent's presence, dimmed once they drop", async () => {
    const { screen, snapshot, trigger } = await renderContent('w');

    expect(screen.queryByTestId('presence-w')).toBeNull();
    expect(screen.getByTestId('presence-b')).toHaveAccessibleName('Online');

    await act(() =>
      trigger('game:presence', {
        gameId: snapshot.id,
        userId: snapshot.black.id,
        online: false,
      }),
    );

    expect(screen.getByTestId('presence-b')).toHaveAccessibleName('Offline');
  });

  it('shows the time control and whether the game is rated in the header', async () => {
    const { screen } = await renderContent('w');

    expect(screen.getByText('5+0 • Casual')).toBeTruthy();
  });

  it("shares the game from the header's menu", async () => {
    const { screen } = await renderContent('w');

    await fireEvent.press(screen.getByTestId('share-game-item'));

    expect(mockShareGame).toHaveBeenCalledTimes(1);
  });

  it('chats with the opponent, counting unread messages until opened', async () => {
    const { screen, socket, snapshot, trigger } = await renderContent('w');
    const fromOpponent = {
      id: 'chat-1',
      gameId: snapshot.id,
      userId: snapshot.black.id,
      kind: 'message',
      text: 'good luck',
      createdAt: '2026-10-27T10:00:00.000Z',
    };

    await act(() => trigger('game:chat', fromOpponent));
    expect(screen.getByTestId('chat-button-badge')).toHaveTextContent('1');

    await fireEvent.press(screen.getByTestId('chat-button'));
    expect(screen.getByText('good luck')).toBeTruthy();
    expect(screen.queryByTestId('chat-button-badge')).toBeNull();

    await fireEvent.changeText(screen.getByTestId('chat-input'), 'thanks');
    await fireEvent.press(screen.getByTestId('chat-send-button'));
    expect(socket.emit).toHaveBeenCalledWith('game:chat', {
      gameId: snapshot.id,
      text: 'thanks',
    });
  });

  it("bookmarks the game from the header's menu", async () => {
    const { screen } = await renderContent('w');

    await fireEvent.press(screen.getByText('Bookmark this game'));

    expect(mockBookmark.toggleBookmark).toHaveBeenCalledTimes(1);
  });

  it('offers to remove a bookmark the game already has', async () => {
    mockBookmark.isBookmarked = true;
    try {
      const { screen } = await renderContent('w');

      expect(screen.getByText('Remove bookmark')).toBeTruthy();
    } finally {
      mockBookmark.isBookmarked = false;
    }
  });

  it.each([
    ['w', 'e1', [BLACK_PLAYER_BAR, WHITE_PLAYER_BAR]],
    ['b', 'e8', [WHITE_PLAYER_BAR, BLACK_PLAYER_BAR]],
  ] as const)(
    "starts from the player's own side when playing %s",
    async (myColor, myKingSquare, expectedBarOrder) => {
      const { screen } = await renderContent(myColor);

      expect(translateYOf(screen.getByTestId(`piece-${myKingSquare}`))).toBe(
        BOTTOM_ROW_Y,
      );
      expect(playerBarOrder(screen)).toEqual(expectedBarOrder);
    },
  );

  it('flips the board from the game menu, swapping the player bars, and flips back', async () => {
    const { screen } = await renderContent('b');

    await flipViaMenu(screen);

    expect(translateYOf(screen.getByTestId('piece-e8'))).toBe(0);
    expect(translateYOf(screen.getByTestId('piece-e1'))).toBe(BOTTOM_ROW_Y);
    expect(playerBarOrder(screen)).toEqual([
      BLACK_PLAYER_BAR,
      WHITE_PLAYER_BAR,
    ]);

    await flipViaMenu(screen);

    expect(translateYOf(screen.getByTestId('piece-e8'))).toBe(BOTTOM_ROW_Y);
    expect(playerBarOrder(screen)).toEqual([
      WHITE_PLAYER_BAR,
      BLACK_PLAYER_BAR,
    ]);
  });

  describe('game menu', () => {
    it('offers aborting, not resigning, before any move', async () => {
      const { screen } = await renderContent('w');

      await openGameMenu(screen);

      expect(screen.getByTestId('abort-game-action')).toBeTruthy();
      expect(screen.queryByTestId('resign-action')).toBeNull();
      expect(screen.getByTestId('toolbar-resign-button')).toBeDisabled();
    });

    it("still offers aborting after white's first move", async () => {
      const { screen, snapshot, trigger } = await renderContent('b');
      await act(() =>
        pushMove(trigger, snapshot.id, moveSummary(1, 'e2', 'e4', AFTER_E4)),
      );

      await openGameMenu(screen);

      expect(screen.getByTestId('abort-game-action')).toBeTruthy();
      expect(screen.queryByTestId('resign-action')).toBeNull();
    });

    it('offers resigning instead once both sides have moved', async () => {
      const { screen, snapshot, trigger } = await renderContent('b');
      await act(() =>
        pushMove(trigger, snapshot.id, moveSummary(1, 'e2', 'e4', AFTER_E4)),
      );
      await act(() =>
        pushMove(trigger, snapshot.id, moveSummary(2, 'e7', 'e5', AFTER_E5)),
      );

      await openGameMenu(screen);

      expect(screen.getByTestId('resign-action')).toBeTruthy();
      expect(screen.queryByTestId('abort-game-action')).toBeNull();
      expect(screen.getByTestId('toolbar-resign-button')).not.toBeDisabled();
    });

    it('asks for confirmation before aborting', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { screen } = await renderContent('w');

      await openGameMenu(screen);
      await chooseMenuAction(screen, 'abort-game-action');

      expect(alertSpy).toHaveBeenCalledWith(
        'Abort game?',
        expect.any(String),
        expect.any(Array),
      );
    });

    it("doesn't offer a draw before both sides have moved", async () => {
      const { screen } = await renderContent('w');

      await openGameMenu(screen);

      expect(screen.queryByTestId('offer-draw-action')).toBeNull();
    });

    it('offers a draw once both sides have moved', async () => {
      const { screen, socket, snapshot, trigger } = await renderContent('w');
      await playFirstMoves(trigger, snapshot.id);

      await openGameMenu(screen);
      await chooseMenuAction(screen, 'offer-draw-action');

      expect(socket.emit).toHaveBeenCalledWith('game:drawOffer', {
        gameId: snapshot.id,
      });
    });
  });

  it("answers the opponent's draw offer from the prompt", async () => {
    const { screen, socket, snapshot, trigger } = await renderContent('b');

    await act(() =>
      trigger('game:drawOffered', { gameId: snapshot.id, by: 'white' }),
    );
    await fireEvent.press(screen.getByTestId('accept-draw-button'));

    expect(socket.emit).toHaveBeenCalledWith('game:drawRespond', {
      gameId: snapshot.id,
      accept: true,
    });
  });

  it("doesn't ask me to answer my own draw offer", async () => {
    const { screen, snapshot, trigger } = await renderContent('b');
    await act(() => playFirstMoves(trigger, snapshot.id));

    await act(() =>
      trigger('game:drawOffered', { gameId: snapshot.id, by: 'black' }),
    );

    expect(screen.queryByTestId('draw-offer-prompt')).toBeNull();
    await openGameMenu(screen);
    expect(screen.queryByTestId('offer-draw-action')).toBeNull();
  });

  it('drops a draw offer when a move is played, as the server does', async () => {
    const { screen, snapshot, trigger } = await renderContent('b');
    await act(() =>
      trigger('game:drawOffered', { gameId: snapshot.id, by: 'white' }),
    );
    expect(screen.getByTestId('draw-offer-prompt')).toBeTruthy();

    await act(() =>
      pushMove(trigger, snapshot.id, moveSummary(1, 'e2', 'e4', AFTER_E4)),
    );

    expect(screen.queryByTestId('draw-offer-prompt')).toBeNull();
  });

  it("shows the server's notes of draws in the chat, mine counting as unread too", async () => {
    const { screen, snapshot, trigger } = await renderContent('b');
    const note = (id: string, userId: string, kind: string) => ({
      id,
      gameId: snapshot.id,
      userId,
      kind,
      text: '',
      createdAt: `2026-10-27T10:00:0${id}.000Z`,
    });

    await act(() =>
      trigger('game:chat', note('1', snapshot.black.id, 'draw-offered')),
    );
    await act(() =>
      trigger('game:chat', note('2', snapshot.white.id, 'draw-declined')),
    );

    expect(screen.getByTestId('chat-button-badge')).toHaveTextContent('2');
    await fireEvent.press(screen.getByTestId('chat-button'));
    expect(screen.getByTestId('chat-notice-1')).toHaveTextContent(
      'You offered a draw',
    );
    expect(screen.getByTestId('chat-notice-2')).toHaveTextContent(
      `${snapshot.white.displayName} declined the draw`,
    );
  });

  describe('move navigation', () => {
    it('shows the earlier position over the board, and returns to live', async () => {
      const { screen, snapshot, trigger } = await renderContent('b');
      await act(() =>
        pushMove(trigger, snapshot.id, moveSummary(1, 'e2', 'e4', AFTER_E4)),
      );
      expect(screen.queryByTestId('earlier-position')).toBeNull();

      await fireEvent.press(screen.getByTestId('previous-move-button'));

      const earlier = within(screen.getByTestId('earlier-position'));
      expect(earlier.getByTestId('piece-e2')).toBeTruthy();
      expect(earlier.queryByTestId('piece-e4')).toBeNull();

      await fireEvent.press(screen.getByTestId('next-move-button'));

      expect(screen.queryByTestId('earlier-position')).toBeNull();
      expect(screen.getByTestId('piece-e4')).toBeTruthy();
    });

    it('keeps the live board mounted while browsing, so returning to live never remounts it', async () => {
      const { screen, snapshot, trigger } = await renderContent('b');
      await act(() =>
        pushMove(trigger, snapshot.id, moveSummary(1, 'e2', 'e4', AFTER_E4)),
      );
      const liveBoard = screen.getByTestId('chessboard');

      await fireEvent.press(screen.getByTestId('previous-move-button'));
      expect(screen.getByTestId('chessboard')).toBe(liveBoard);

      await fireEvent.press(screen.getByTestId('next-move-button'));
      expect(screen.getByTestId('chessboard')).toBe(liveBoard);
    });

    it('keeps the earlier-position board mounted but hidden while live, so stepping back reuses it', async () => {
      const { screen, snapshot, trigger } = await renderContent('b');
      await act(() =>
        pushMove(trigger, snapshot.id, moveSummary(1, 'e2', 'e4', AFTER_E4)),
      );
      expect(screen.queryByTestId('static-chessboard')).toBeNull();
      const hiddenStaticBoard = screen.getByTestId('static-chessboard', {
        includeHiddenElements: true,
      });

      await fireEvent.press(screen.getByTestId('previous-move-button'));

      expect(screen.getByTestId('static-chessboard')).toBe(hiddenStaticBoard);
    });

    it('lists the moves and jumps to one when it is tapped', async () => {
      const { screen, snapshot, trigger } = await renderContent('b');
      await act(() =>
        pushMove(trigger, snapshot.id, moveSummary(1, 'e2', 'e4', AFTER_E4)),
      );
      await act(() =>
        pushMove(trigger, snapshot.id, moveSummary(2, 'e7', 'e5', AFTER_E5)),
      );
      expect(screen.getByTestId('move-2')).toBeSelected();

      await fireEvent.press(screen.getByTestId('move-1'));

      expect(screen.getByTestId('move-1')).toBeSelected();
      const earlier = within(screen.getByTestId('earlier-position'));
      expect(earlier.getByTestId('piece-e4')).toBeTruthy();
      expect(earlier.getByTestId('piece-e7')).toBeTruthy();
    });

    it('returns to live when a new move arrives while browsing', async () => {
      const { screen, snapshot, trigger } = await renderContent('b');
      await act(() =>
        pushMove(trigger, snapshot.id, moveSummary(1, 'e2', 'e4', AFTER_E4)),
      );
      await fireEvent.press(screen.getByTestId('previous-move-button'));

      await act(() =>
        pushMove(trigger, snapshot.id, moveSummary(2, 'e7', 'e5', AFTER_E5)),
      );

      expect(screen.queryByTestId('earlier-position')).toBeNull();
      expect(screen.getByTestId('piece-e4')).toBeTruthy();
      expect(screen.getByTestId('piece-e5')).toBeTruthy();
    });
  });

  it('still flips once the game is over, from a menu that no longer offers abort or resign', async () => {
    const { screen, snapshot, trigger } = await renderContent('w');

    await act(() => {
      trigger('game:over', {
        ...snapshot,
        status: 'completed',
        result: 'black',
        resultReason: GAME_RESULT_REASON.RESIGNATION,
      });
    });
    await openGameMenu(screen);
    expect(screen.queryByTestId('abort-game-action')).toBeNull();
    expect(screen.queryByTestId('resign-action')).toBeNull();
    await chooseMenuAction(screen, 'flip-board-action');

    expect(translateYOf(screen.getByTestId('piece-e1'))).toBe(0);
    expect(playerBarOrder(screen)).toEqual([
      WHITE_PLAYER_BAR,
      BLACK_PLAYER_BAR,
    ]);
  });

  describe('game over', () => {
    async function finishGame(
      trigger: (event: string, payload: unknown) => void,
      snapshot: ReturnType<typeof makeGameSnapshot>,
      overrides: Partial<ReturnType<typeof makeGameSnapshot>> = {},
    ) {
      await act(() => {
        trigger('game:over', {
          ...snapshot,
          status: 'completed',
          result: 'white',
          resultReason: GAME_RESULT_REASON.CHECKMATE,
          ...overrides,
        });
      });
    }

    it('shows the result on a card over the dimmed board', async () => {
      const { screen, snapshot, trigger } = await renderContent('w');

      await finishGame(trigger, snapshot);

      expect(screen.getByTestId('game-over-overlay')).toBeTruthy();
      expect(screen.getByText('You won')).toBeTruthy();
    });

    it('can be dismissed to see the final position, and brought back', async () => {
      const { screen, snapshot, trigger } = await renderContent('w');
      await finishGame(trigger, snapshot);

      expect(screen.getByTestId(WHITE_PLAYER_BAR)).toHaveStyle({
        opacity: 0.5,
      });

      await fireEvent.press(screen.getByTestId('game-over-dismiss'));
      expect(screen.queryByTestId('game-over-card')).toBeNull();
      // Not dimmed once the card is put away.
      expect(screen.getByTestId(WHITE_PLAYER_BAR)).not.toHaveStyle({
        opacity: 0.5,
      });

      await openGameMenu(screen);
      await chooseMenuAction(screen, 'show-result-action');
      expect(screen.getByTestId('game-over-card')).toBeTruthy();
    });

    it('goes away when the board around it is tapped', async () => {
      const { screen, snapshot, trigger } = await renderContent('w');
      await finishGame(trigger, snapshot);

      await fireEvent.press(screen.getByTestId('game-over-overlay'));

      expect(screen.queryByTestId('game-over-card')).toBeNull();
    });

    it('offers a rematch after a game played out, but not an aborted one', async () => {
      const played = await renderContent('w');
      await finishGame(played.trigger, played.snapshot);
      expect(played.screen.getByTestId('rematch-button')).toBeTruthy();

      const aborted = await renderContent('w');
      await finishGame(aborted.trigger, aborted.snapshot, {
        status: 'aborted',
        result: null,
        resultReason: GAME_RESULT_REASON.ABORT,
      });
      expect(aborted.screen.getByText('Game aborted')).toBeTruthy();
      expect(aborted.screen.queryByTestId('rematch-button')).toBeNull();
    });

    it('comes back by itself when the opponent offers a rematch', async () => {
      const { screen, snapshot, trigger } = await renderContent('w');
      await finishGame(trigger, snapshot);
      await fireEvent.press(screen.getByTestId('game-over-dismiss'));

      await act(() =>
        trigger('game:rematchOffered', { gameId: snapshot.id, by: 'black' }),
      );

      expect(screen.getByTestId('rematch-status')).toHaveTextContent(
        'Rematch offered',
      );
      expect(screen.getByTestId('rematch-accept-button')).toBeTruthy();
      expect(screen.getByTestId('rematch-status')).not.toHaveTextContent(
        'Black',
      );
    });

    it('offers a new opponent from the menu once the game is over', async () => {
      const { screen, snapshot, trigger, onNewOpponent } =
        await renderContent('w');
      await finishGame(trigger, snapshot);

      await openGameMenu(screen);
      expect(screen.queryByTestId('show-result-action')).toBeNull();
      await chooseMenuAction(screen, 'new-opponent-action');

      expect(onNewOpponent).toHaveBeenCalledWith(
        expect.objectContaining({ initialSeconds: 300, incrementSeconds: 0 }),
      );
    });

    describe('ratings', () => {
      function withRatings(whiteRating: number, blackRating: number) {
        const { white, black } = makeGameSnapshot();
        return {
          rated: true,
          white: { ...white, rating: whiteRating },
          black: { ...black, rating: blackRating },
        };
      }

      it('shows both players with their ratings', async () => {
        const { screen } = await renderContent('w', withRatings(1500, 1480));

        expect(screen.getByTestId('player-rating-w')).toHaveTextContent('1500');
        expect(screen.getByTestId('player-rating-b')).toHaveTextContent('1480');
      });

      it("shows the player's own new rating and change once a rated game ends", async () => {
        const { screen, snapshot, trigger } = await renderContent(
          'b',
          withRatings(1500, 1480),
        );

        await finishGame(trigger, snapshot, {
          result: 'black',
          whiteRatingDiff: -12,
          blackRatingDiff: 12,
        });

        expect(screen.getByText('Rating 1492')).toBeTruthy();
        expect(screen.getByText('+12')).toBeTruthy();
      });

      it('shows no rating on the card after a casual game', async () => {
        const { screen, snapshot, trigger } = await renderContent(
          'w',
          withRatings(1500, 1480),
        );

        await finishGame(trigger, snapshot);

        expect(screen.queryByTestId('game-over-rating')).toBeNull();
      });
    });

    it('says an aborted game was aborted', async () => {
      const { screen, snapshot, trigger } = await renderContent('w');

      await finishGame(trigger, snapshot, {
        status: 'aborted',
        result: null,
        resultReason: GAME_RESULT_REASON.ABORT,
      });

      expect(screen.getByText('Game aborted')).toBeTruthy();
    });

    it('looks for a new opponent with the same time control', async () => {
      const { screen, snapshot, trigger, onNewOpponent } =
        await renderContent('w');
      await finishGame(trigger, snapshot);

      await fireEvent.press(screen.getByTestId('new-opponent-button'));

      expect(onNewOpponent).toHaveBeenCalledWith(
        findTimeControl(
          snapshot.initialSeconds,
          snapshot.incrementSeconds,
          snapshot.gameType,
        ),
      );
    });

    it('swaps the connection indicator for a back button that leaves the game', async () => {
      const { screen, snapshot, trigger, navigation } =
        await renderContent('w');
      expect(screen.queryByTestId('game-header-back')).toBeNull();

      await finishGame(trigger, snapshot);
      await fireEvent.press(screen.getByTestId('game-header-back'));

      expect(navigation.popToTop).toHaveBeenCalledTimes(1);
    });

    it('moves the card out of the way while reviewing earlier moves', async () => {
      const { screen, snapshot, trigger } = await renderContent('b');
      await act(() =>
        pushMove(trigger, snapshot.id, moveSummary(1, 'e2', 'e4', AFTER_E4)),
      );
      await finishGame(trigger, snapshot);

      await fireEvent.press(screen.getByTestId('previous-move-button'));

      expect(screen.queryByTestId('game-over-overlay')).toBeNull();
    });
  });
});
