import { fireEvent, render } from '@testing-library/react-native';

import OnlineFriendsStrip from '.';
import { makeFriend } from '../../testUtils/social';

describe('OnlineFriendsStrip', () => {
  it('shows the friends around, playing first, and opens one', async () => {
    const online = makeFriend({ id: 'online', online: true });
    const playing = makeFriend({
      id: 'playing',
      online: true,
      playingGameId: 'g',
    });
    const away = makeFriend({ id: 'away', online: false });
    const onPress = jest.fn();
    const screen = await render(
      <OnlineFriendsStrip
        friends={[online, away, playing]}
        onPress={onPress}
      />,
    );

    expect(
      screen.getAllByTestId(/^online-friend-/).map((each) => each.props.testID),
    ).toEqual(['online-friend-playing', 'online-friend-online']);
    await fireEvent.press(screen.getByTestId('online-friend-online'));
    expect(onPress).toHaveBeenCalledWith(online);
  });

  it('shows nothing while nobody is around', async () => {
    const screen = await render(
      <OnlineFriendsStrip
        friends={[makeFriend({ online: false })]}
        onPress={jest.fn()}
      />,
    );

    expect(screen.queryByTestId('online-friends')).toBeNull();
  });
});
