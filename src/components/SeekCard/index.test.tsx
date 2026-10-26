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
});
