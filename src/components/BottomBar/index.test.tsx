import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import BottomBar from '.';
import { TEST_SAFE_AREA_METRICS, withSafeArea } from '../../testUtils/safeArea';

describe('BottomBar', () => {
  it('renders its contents', async () => {
    const screen = await render(
      withSafeArea(
        <BottomBar>
          <Text>Cancel</Text>
        </BottomBar>,
      ),
    );

    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('pads itself clear of the home indicator', async () => {
    const screen = await render(
      withSafeArea(<BottomBar testID="bottom-bar" />),
    );
    expect(screen.getByTestId('bottom-bar')).toHaveStyle({
      paddingBottom: TEST_SAFE_AREA_METRICS.insets.bottom,
    });
  });
});
