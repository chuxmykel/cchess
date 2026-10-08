import { fireEvent, render } from '@testing-library/react-native';

import TimeControlTrigger from './TimeControlTrigger';
import { TimeControl } from '../../constants/timeControls';

const BLITZ_5_0: TimeControl = { type: 'blitz', label: '5+0' };

describe('TimeControlTrigger', () => {
  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    const screen = await render(
      <TimeControlTrigger
        selected={BLITZ_5_0}
        sheetOpen={false}
        onPress={onPress}
      />,
    );

    await fireEvent.press(screen.getByTestId('time-control-trigger'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows the game type alongside the label by default', async () => {
    const screen = await render(
      <TimeControlTrigger
        selected={BLITZ_5_0}
        sheetOpen={false}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('Blitz · 5+0')).toBeTruthy();
  });

  it('shows only the time control label when showTypeName is false', async () => {
    const screen = await render(
      <TimeControlTrigger
        selected={BLITZ_5_0}
        sheetOpen={false}
        onPress={jest.fn()}
        showTypeName={false}
      />,
    );

    expect(screen.queryByText('Blitz · 5+0')).toBeNull();
    expect(screen.getByText('5+0')).toBeTruthy();
  });
});
