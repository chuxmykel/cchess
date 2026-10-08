import { render } from '@testing-library/react-native';

import ToastBubble from '.';

describe('ToastBubble', () => {
  it('renders its message', async () => {
    const screen = await render(<ToastBubble message="Saved!" />);

    expect(screen.getByText('Saved!')).toBeTruthy();
  });
});
