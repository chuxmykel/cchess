import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import HomeHeader from '.';
import { withSafeArea } from '../../testUtils/safeArea';

describe('HomeHeader', () => {
  it('calls onAvatarPress when the avatar is pressed', async () => {
    const onAvatarPress = jest.fn();
    const screen = await render(
      withSafeArea(<HomeHeader onAvatarPress={onAvatarPress} />),
    );

    await fireEvent.press(screen.getByTestId('avatar-button'));

    expect(onAvatarPress).toHaveBeenCalledTimes(1);
  });

  it("shows the player's initials in their avatar color", async () => {
    const screen = await render(
      withSafeArea(
        <HomeHeader
          avatarName="Magnus Carlsen"
          avatarColor="#3b82f6"
          onAvatarPress={jest.fn()}
        />,
      ),
    );

    expect(screen.getByText('MC')).toBeTruthy();
    expect(screen.getByTestId('avatar-placeholder')).toHaveStyle({
      backgroundColor: '#3b82f6',
    });
  });

  it('shows an accessory beside the avatar', async () => {
    const screen = await render(
      withSafeArea(
        <HomeHeader onAvatarPress={jest.fn()} accessory={<Text>bell</Text>} />,
      ),
    );

    expect(screen.getByText('bell')).toBeTruthy();
  });

  it('shows the generic avatar without a name', async () => {
    const screen = await render(
      withSafeArea(<HomeHeader onAvatarPress={jest.fn()} />),
    );

    expect(screen.getByTestId('avatar-guest-icon')).toBeTruthy();
  });
});
