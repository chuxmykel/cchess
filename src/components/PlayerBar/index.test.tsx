import { render, within } from '@testing-library/react-native';
import { Color } from 'chess.js';

import PlayerBar from '.';
import { SideMaterial } from '../../domain/material';
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
      material: SideMaterial;
      series: { white: number; black: number } | null;
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
        material={overrides.material}
        series={overrides.series}
      />,
    );
  }

  it("shows white's name and clock for the white bar", async () => {
    const screen = await renderBar('w');

    expect(screen.getByTestId('player-bar-w')).toBeTruthy();
    expect(screen.getByText(white.displayName)).toBeTruthy();
    expect(screen.getByLabelText('White clock, 1:05')).toBeTruthy();
    expect(screen.queryByText('White')).toBeNull();
  });

  it("shows black's name and clock for the black bar", async () => {
    const screen = await renderBar('b');

    expect(screen.getByTestId('player-bar-b')).toBeTruthy();
    expect(screen.getByText(black.displayName)).toBeTruthy();
    expect(screen.getByLabelText('Black clock, 0:30')).toBeTruthy();
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

  it("shows each side's points in a rematch series, as decimals", async () => {
    const series = { white: 1.5, black: 0.5 };

    const whiteBar = await renderBar('w', { series });
    expect(whiteBar.getByTestId('series-points-w')).toHaveTextContent('1.5');
    const blackBar = await renderBar('b', { series });
    expect(blackBar.getByTestId('series-points-b')).toHaveTextContent('0.5');
  });

  it('lifts the initials clear of the series band', async () => {
    const inSeries = await renderBar('w', { series: { white: 1, black: 0 } });
    expect(inSeries.getByText('GW')).toHaveStyle({
      transform: [{ translateY: -6.5 }],
    });
    await inSeries.unmount();

    const outside = await renderBar('w');
    expect(outside.getByText('GW')).not.toHaveStyle({
      transform: [{ translateY: -6.5 }],
    });
  });

  it("shows the player's avatar before their name", async () => {
    const screen = await renderBar('w');

    expect(screen.getByTestId('player-avatar-w')).toHaveTextContent('GW');
  });

  it('shows no points outside a series', async () => {
    const screen = await renderBar('w');

    expect(screen.queryByTestId('series-points-w')).toBeNull();
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

    it('shows it as a badge on the avatar', async () => {
      const screen = await renderBar('b', { isOnline: true });

      expect(
        within(screen.getByTestId('player-avatar-b')).getByTestId('presence-b'),
      ).toBeTruthy();
    });

    it('shows no dot without presence', async () => {
      const screen = await renderBar('w');

      expect(screen.queryByTestId('presence-w')).toBeNull();
    });
  });

  it("shows the opponent's pieces the player is up, and by how much", async () => {
    const screen = await renderBar('w', {
      material: { pieces: ['n', 'p'], score: 4 },
    });

    expect(screen.getAllByTestId('captured-piece-w')).toHaveLength(2);
    expect(screen.getByTestId('material-score-w')).toHaveTextContent('+4');
  });

  it('shows no material when the sides are level', async () => {
    const screen = await renderBar('w', {
      material: { pieces: [], score: 0 },
    });

    expect(screen.queryByTestId('captured-pieces-w')).toBeNull();
  });

  it('shows the first-move countdown in place of the material', async () => {
    const screen = await renderBar('w', {
      turn: 'w',
      firstMoveSecondsLeft: 20,
      material: { pieces: ['p'], score: 1 },
    });

    expect(screen.getByTestId('first-move-countdown-w')).toBeTruthy();
    expect(screen.queryByTestId('captured-pieces-w')).toBeNull();
  });

  it('keeps the line under the name the same height, empty or not', async () => {
    const empty = await renderBar('w');
    expect(empty.getByTestId('player-subline-w')).toHaveStyle({ height: 16 });
    await empty.unmount();

    const withPieces = await renderBar('w', {
      material: { pieces: ['p'], score: 1 },
    });
    expect(withPieces.getByTestId('player-subline-w')).toHaveStyle({
      height: 16,
    });
    expect(withPieces.getByTestId('player-bar-w')).toHaveStyle({ height: 40 });
  });
});
