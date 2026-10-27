import { fireEvent, render } from '@testing-library/react-native';

import EmptyState from '.';

describe('EmptyState', () => {
  it('says what will show up here', async () => {
    const screen = await render(
      <EmptyState
        illustration="games"
        title="No games yet"
        message="Your games will show up here."
      />,
    );

    expect(screen.getByText('No games yet')).toBeTruthy();
    expect(screen.getByText('Your games will show up here.')).toBeTruthy();
  });

  it('offers a way forward', async () => {
    const onPress = jest.fn();
    const screen = await render(
      <EmptyState
        illustration="friends"
        title="No friends yet"
        message="Add some."
        action={{ label: 'Find friends', onPress, testID: 'find-friends' }}
      />,
    );

    await fireEvent.press(screen.getByTestId('find-friends'));

    expect(onPress).toHaveBeenCalled();
  });
});
