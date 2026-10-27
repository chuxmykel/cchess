import { render } from '@testing-library/react-native';
import { Color } from 'chess.js';

import PlayerBar from '.';
import { GameUserSummary } from '../../network/socketEvents';

describe('PlayerBar', () => {
  const white: GameUserSummary = {
    id: 'white-id',
    username: 'guest-white',
    displayName: 'Guest White',
    avatarColor: '#fff',
    rating: 1520,
    provisional: false,
  };
  const black: GameUserSummary = {
    id: 'black-id',
    username: 'guest-black',
    displayName: 'Guest Black',
    avatarColor: '#000',
    rating: null,
    provisional: false,
  };
  const clock = { whiteMs: 65000, blackMs: 30000 };

  function renderBar(
    color: Color,
    overrides: Partial<{
      turn: Color;
      isGameOver: boolean;
      firstMoveSecondsLeft: number | null;
      isOnline: boolean;
    }> = {},
  ) {
    return render(
      <PlayerBar
        color={color}
        white={white}
        black={black}
        clock={clock}
        turn={overrides.turn ?? 'w'}
        isGameOver={overrides.isGameOver ?? false}
        firstMoveSecondsLeft={overrides.firstMoveSecondsLeft ?? null}
        isOnline={overrides.isOnline}
      />,
    );
  }

  it("shows white's name, clock and label for the white bar", async () => {
    const screen = await renderBar('w');

    expect(screen.getByTestId('player-bar-w')).toBeTruthy();
    expect(screen.getByText(white.displayName)).toBeTruthy();
    expect(screen.getByText('White')).toBeTruthy();
    expect(screen.getByText('1:05')).toBeTruthy();
  });

  it("shows black's name, clock and label for the black bar", async () => {
    const screen = await renderBar('b');

    expect(screen.getByTestId('player-bar-b')).toBeTruthy();
    expect(screen.getByText(black.displayName)).toBeTruthy();
    expect(screen.getByText('Black')).toBeTruthy();
    expect(screen.getByText('0:30')).toBeTruthy();
  });

  it("highlights the clock only on that side's turn", async () => {
    const onTurn = await renderBar('b', { turn: 'b' });
    const activeStyle = onTurn.getByTestId('game-clock-Black').props.style;

    const offTurn = await renderBar('b', { turn: 'w' });
    const idleStyle = offTurn.getByTestId('game-clock-Black').props.style;

    expect(activeStyle).not.toEqual(idleStyle);
  });

  it('stops highlighting the clock once the game is over', async () => {
    const over = await renderBar('w', { turn: 'w', isGameOver: true });
    const idle = await renderBar('w', { turn: 'b' });

    expect(over.getByTestId('game-clock-White').props.style).toEqual(
      idle.getByTestId('game-clock-White').props.style,
    );
  });

  it('fades once the game is over', async () => {
    const live = await renderBar('w');
    expect(live.getByTestId('player-bar-w')).not.toHaveStyle({ opacity: 0.5 });

    const over = await renderBar('w', { isGameOver: true });
    expect(over.getByTestId('player-bar-w')).toHaveStyle({ opacity: 0.5 });
  });

  it("shows a player's rating beside their name", async () => {
    const screen = await renderBar('w');

    expect(screen.getByTestId('player-rating-w')).toHaveTextContent('1520');
  });

  it('marks a provisional rating with a question mark', async () => {
    const screen = await render(
      <PlayerBar
        color="w"
        white={{ ...white, provisional: true }}
        black={black}
        clock={clock}
        turn="w"
        isGameOver={false}
      />,
    );

    expect(screen.getByTestId('player-rating-w')).toHaveTextContent('1520?');
  });

  it("shows no rating for a guest, who doesn't have one", async () => {
    const screen = await renderBar('b');

    expect(screen.queryByTestId('player-rating-b')).toBeNull();
  });

  describe('first move countdown', () => {
    it('tells the side to move how long it has to play its first move', async () => {
      const screen = await renderBar('w', { firstMoveSecondsLeft: 25 });

      expect(
        screen.getByText('25 seconds to play the first move'),
      ).not.toHaveStyle({ color: '#d33' });
    });

    it('turns red with 10 seconds or less left', async () => {
      const screen = await renderBar('w', { firstMoveSecondsLeft: 10 });

      expect(screen.getByText('10 seconds to play the first move')).toHaveStyle(
        { color: '#d33' },
      );
    });

    it("isn't shown for the side waiting, or once the game is over", async () => {
      const waiting = await renderBar('b', { firstMoveSecondsLeft: 25 });
      expect(waiting.queryByTestId('first-move-countdown-b')).toBeNull();
      await waiting.unmount();

      const over = await renderBar('w', {
        firstMoveSecondsLeft: 25,
        isGameOver: true,
      });
      expect(over.queryByTestId('first-move-countdown-w')).toBeNull();
    });
  });

  describe('presence', () => {
    it('shows whether the player is online when known', async () => {
      const online = await renderBar('b', { isOnline: true });
      expect(online.getByLabelText('Online')).toBeTruthy();
      await online.unmount();

      const offline = await renderBar('b', { isOnline: false });
      expect(offline.getByLabelText('Offline')).toBeTruthy();
    });

    it('shows no dot without presence', async () => {
      const screen = await renderBar('w');

      expect(screen.queryByTestId('presence-w')).toBeNull();
    });
  });
});
