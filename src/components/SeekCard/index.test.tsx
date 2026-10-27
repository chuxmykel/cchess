import { render } from '@testing-library/react-native';

import SeekCard from '.';
import { TimeControl } from '../../constants/timeControls';

describe('SeekCard', () => {
  const bullet2Plus1: TimeControl = {
    type: 'bullet',
    label: '2+1',
    minutes: 2,
    incrementSeconds: 1,
  };

  it('shows that it is waiting, and for which time control', async () => {
    const screen = await render(<SeekCard timeControl={bullet2Plus1} />);

    expect(screen.getByText('Waiting for opponent to join…')).toBeTruthy();
    expect(screen.getByText('2+1')).toBeTruthy();
  });

  it('shows a custom status in place of the waiting line', async () => {
    const screen = await render(
      <SeekCard timeControl={bullet2Plus1} status="Connecting…" />,
    );

    expect(screen.getByText('Connecting…')).toBeTruthy();
    expect(screen.queryByText('Waiting for opponent to join…')).toBeNull();
  });

  it('shows the rating range when there is one', async () => {
    const screen = await render(
      <SeekCard timeControl={bullet2Plus1} ratingRange="1320–2020" />,
    );

    expect(screen.getByText('1320–2020')).toBeTruthy();
  });

  it('shows players online and games in play once known', async () => {
    const screen = await render(
      <SeekCard
        timeControl={bullet2Plus1}
        lobbyStats={{ playersOnline: 12, gamesInPlay: 1 }}
      />,
    );

    expect(screen.getByText('12 players online')).toBeTruthy();
    expect(screen.getByText('1 game in play')).toBeTruthy();
  });

  it('leaves the lobby stats out until they arrive', async () => {
    const screen = await render(
      <SeekCard timeControl={bullet2Plus1} lobbyStats={null} />,
    );

    expect(screen.queryByTestId('seek-card-lobby-stats')).toBeNull();
  });

  it('leaves the rating range out without one', async () => {
    const screen = await render(<SeekCard timeControl={bullet2Plus1} />);

    expect(screen.queryByTestId('seek-card-rating-range')).toBeNull();
  });
});
