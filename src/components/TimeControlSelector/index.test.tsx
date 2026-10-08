import { act, fireEvent, render } from '@testing-library/react-native';

import TimeControlSelector from '.';
import { DEFAULT_TIME_CONTROL } from '../../constants/timeControls';
import { withSafeArea } from '../../testUtils/safeArea';

const TRIGGER_TEST_ID = 'time-control-trigger';
const BLITZ_5_0_TEST_ID = 'time-control-option-blitz-5+0';
const RAPID_15_0_TEST_ID = 'time-control-option-rapid-15+0';

describe('TimeControlSelector', () => {
  it('opens the options sheet when the trigger is pressed', async () => {
    const screen = await render(
      withSafeArea(
        <TimeControlSelector
          selected={DEFAULT_TIME_CONTROL}
          onSelect={jest.fn()}
        />,
      ),
    );
    expect(screen.queryByTestId(BLITZ_5_0_TEST_ID)).toBeNull();

    await fireEvent.press(screen.getByTestId(TRIGGER_TEST_ID));

    expect(screen.getByTestId(BLITZ_5_0_TEST_ID)).toBeTruthy();
  });

  it('calls onSelect and closes the sheet once an option is picked', async () => {
    const onSelect = jest.fn();
    const screen = await render(
      withSafeArea(
        <TimeControlSelector
          selected={DEFAULT_TIME_CONTROL}
          onSelect={onSelect}
        />,
      ),
    );

    await fireEvent.press(screen.getByTestId(TRIGGER_TEST_ID));
    await fireEvent.press(screen.getByTestId(RAPID_15_0_TEST_ID));

    expect(onSelect).toHaveBeenCalledWith({ type: 'rapid', label: '15+0' });

    // The sheet only unmounts once its close animation's completion
    // callback fires (see useBottomSheet), so give that a moment to run.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
    expect(screen.queryByTestId(RAPID_15_0_TEST_ID)).toBeNull();
  });
});
