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
  };
  const black: GameUserSummary = {
    id: 'black-id',
    username: 'guest-black',
    displayName: 'Guest Black',
    avatarColor: '#000',
  };
  const clock = { whiteMs: 65000, blackMs: 30000 };

  function renderBar(
    color: Color,
    overrides: Partial<{ turn: Color; isGameOver: boolean }> = {},
  ) {
    return render(
      <PlayerBar
        color={color}
        white={white}
        black={black}
        clock={clock}
        turn={overrides.turn ?? 'w'}
        isGameOver={overrides.isGameOver ?? false}
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
});
