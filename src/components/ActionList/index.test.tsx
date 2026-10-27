import { fireEvent, render } from '@testing-library/react-native';

import ActionList from '.';

describe('ActionList', () => {
  it('runs a row action and leaves an information row inert', async () => {
    const onPress = jest.fn();
    const screen = await render(
      <ActionList
        items={[
          { label: 'Your score: 1 - 0', icon: 'scale-balance', testID: 'info' },
          {
            label: 'Message',
            icon: 'message-outline',
            onPress,
            testID: 'message',
          },
        ]}
      />,
    );

    await fireEvent.press(screen.getByTestId('message'));

    expect(onPress).toHaveBeenCalled();
    expect(screen.getByTestId('info')).toBeDisabled();
  });
});
