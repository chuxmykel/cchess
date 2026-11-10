import { fireEvent, render } from '@testing-library/react-native';

import FriendPickerSheet, { matchingFriends } from '.';
import { withSafeArea } from '../../testUtils/safeArea';
import { makeFriend } from '../../testUtils/social';

const ANA = makeFriend({
  id: 'ana',
  username: 'ana_k',
  displayName: 'Ana Kim',
});
const BO = makeFriend({
  id: 'bo',
  username: 'bo',
  displayName: 'Bo Lee',
  online: true,
});

describe('FriendPickerSheet', () => {
  it('lists friends, around first, narrowed by name, and picks one', async () => {
    const onPick = jest.fn();
    const screen = await render(
      withSafeArea(
        <FriendPickerSheet
          visible
          title="New message"
          friends={[ANA, BO]}
          onPick={onPick}
          onClose={jest.fn()}
        />,
      ),
    );

    expect(
      screen.getAllByTestId(/^friend-row-/).map((each) => each.props.testID),
    ).toEqual(['friend-row-bo', 'friend-row-ana']);
    await fireEvent.changeText(
      screen.getByTestId('friend-picker-search'),
      'kim',
    );
    expect(screen.queryByTestId('friend-row-bo')).toBeNull();
    await fireEvent.press(screen.getByTestId('friend-row-ana'));

    expect(onPick).toHaveBeenCalledWith(ANA);
  });

  it('says when nobody matches, or there are no friends at all', async () => {
    const screen = await render(
      withSafeArea(
        <FriendPickerSheet
          visible
          title="New message"
          friends={[ANA]}
          onPick={jest.fn()}
          onClose={jest.fn()}
        />,
      ),
    );
    await fireEvent.changeText(
      screen.getByTestId('friend-picker-search'),
      'zed',
    );
    expect(screen.getByText('No friends match “zed”')).toBeTruthy();

    const empty = await render(
      withSafeArea(
        <FriendPickerSheet
          visible
          title="New message"
          friends={[]}
          onPick={jest.fn()}
          onClose={jest.fn()}
        />,
      ),
    );
    expect(empty.getByText('No friends yet')).toBeTruthy();
  });
});

describe('matchingFriends', () => {
  it('matches the name or username, ignoring case', () => {
    expect(matchingFriends([ANA, BO], 'ANA_')).toEqual([ANA]);
    expect(matchingFriends([ANA, BO], ' lee ')).toEqual([BO]);
    expect(matchingFriends([ANA, BO], '')).toEqual([BO, ANA]);
  });
});
