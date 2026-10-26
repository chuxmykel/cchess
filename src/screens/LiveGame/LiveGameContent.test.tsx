import { act, fireEvent, render } from '@testing-library/react-native';
import { Color } from 'chess.js';

import LiveGameContent, { LiveGameContentNavigation } from './LiveGameContent';
import { OnlineChessGameProvider } from '../../context/LiveGame/OnlineChessGameContext';
import { NUMBER_OF_ROWS } from '../../constants';
import { GAME_RESULT_REASON } from '../../network/socketEvents';
import { createFakeSocket } from '../../testUtils/fakeSocket';
import { makeGameSnapshot } from '../../testUtils/gameSnapshot';
import { withSafeArea } from '../../testUtils/safeArea';

describe('LiveGameContent', () => {
  const width = 400;
  const PIECE_WIDTH = width / NUMBER_OF_ROWS;
  const BOTTOM_ROW_Y = (NUMBER_OF_ROWS - 1) * PIECE_WIDTH;
  const WHITE_PLAYER_BAR = 'player-bar-w';
  const BLACK_PLAYER_BAR = 'player-bar-b';

  async function renderContent(myColor: Color) {
    const { socket, trigger } = createFakeSocket();
    const snapshot = makeGameSnapshot();
    const navigation: LiveGameContentNavigation = {
      setOptions: jest.fn(),
      popToTop: jest.fn(),
    };
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
            white={snapshot.white}
            black={snapshot.black}
          />
        </OnlineChessGameProvider>,
      ),
    );
    return { screen, snapshot, trigger, navigation };
  }

  // Player bars in render order, top of the screen first.
  function playerBarOrder(screen: Awaited<ReturnType<typeof render>>) {
    return screen.getAllByTestId(/^player-bar-/).map((bar) => bar.props.testID);
  }

  function translateYOf(element: { props: Record<string, any> }) {
    return element.props.style.transform[1].translateY;
  }

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

  it('flips the board and swaps the player bars, and flips back', async () => {
    const { screen } = await renderContent('b');

    await fireEvent.press(screen.getByTestId('flip-board-button'));

    expect(translateYOf(screen.getByTestId('piece-e8'))).toBe(0);
    expect(translateYOf(screen.getByTestId('piece-e1'))).toBe(BOTTOM_ROW_Y);
    expect(playerBarOrder(screen)).toEqual([
      BLACK_PLAYER_BAR,
      WHITE_PLAYER_BAR,
    ]);

    await fireEvent.press(screen.getByTestId('flip-board-button'));

    expect(translateYOf(screen.getByTestId('piece-e8'))).toBe(BOTTOM_ROW_Y);
    expect(playerBarOrder(screen)).toEqual([
      WHITE_PLAYER_BAR,
      BLACK_PLAYER_BAR,
    ]);
  });

  it('still flips once the game is over', async () => {
    const { screen, snapshot, trigger } = await renderContent('w');

    await act(() => {
      trigger('game:over', {
        ...snapshot,
        status: 'completed',
        result: 'black',
        resultReason: GAME_RESULT_REASON.RESIGNATION,
      });
    });
    expect(screen.queryByTestId('resign-button')).toBeNull();
    expect(screen.queryByTestId('abort-button')).toBeNull();

    await fireEvent.press(screen.getByTestId('flip-board-button'));

    expect(translateYOf(screen.getByTestId('piece-e1'))).toBe(0);
    expect(playerBarOrder(screen)).toEqual([
      WHITE_PLAYER_BAR,
      BLACK_PLAYER_BAR,
    ]);
  });

  it('returns to the top of the stack from the game-over banner', async () => {
    const { screen, snapshot, trigger, navigation } = await renderContent('w');

    await act(() => {
      trigger('game:over', {
        ...snapshot,
        status: 'completed',
        result: 'white',
        resultReason: GAME_RESULT_REASON.CHECKMATE,
      });
    });
    await fireEvent.press(screen.getByTestId('game-over-done-button'));

    expect(navigation.popToTop).toHaveBeenCalledTimes(1);
  });
});
