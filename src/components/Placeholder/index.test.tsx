import { render } from '@testing-library/react-native';

import Placeholder from '.';

describe('Placeholder', () => {
  it('takes the given size', async () => {
    const screen = await render(
      <Placeholder width="45%" height={18} testID="placeholder" />,
    );

    expect(screen.getByTestId('placeholder')).toHaveStyle({
      width: '45%',
      height: 18,
    });
  });
});
