import { fireEvent, render } from '@testing-library/react-native';

import ProfileFriends, { PROFILE_FRIENDS_SHOWN } from '.';
import { makeUserFriend } from '../../testUtils/social';

describe('ProfileFriends', () => {
  function renderSection(
    overrides: Partial<React.ComponentProps<typeof ProfileFriends>> = {},
  ) {
    const props = {
      count: 2,
      friends: [
        makeUserFriend({ id: 'away', displayName: 'Away' }),
        makeUserFriend({ id: 'online', displayName: 'Online', online: true }),
      ],
      emptyMessage: 'Their friends will show up here.',
      onSelect: jest.fn(),
      onViewAll: jest.fn(),
      ...overrides,
    };
    return { props, screenPromise: render(<ProfileFriends {...props} />) };
  }

  it('shows the count and online friends first', async () => {
    const { screenPromise } = renderSection();
    const screen = await screenPromise;

    expect(
      screen.getByTestId('profile-friends-view-all-count'),
    ).toHaveTextContent('2', { exact: false });
    const tiles = screen.getAllByTestId(/^profile-friend-(away|online)$/);
    expect(tiles.map((tile) => tile.props.testID)).toEqual([
      'profile-friend-online',
      'profile-friend-away',
    ]);
    expect(screen.getByTestId('profile-friend-online-online')).toBeTruthy();
    expect(screen.queryByTestId('profile-friend-online-away')).toBeNull();
  });

  it(`shows at most ${PROFILE_FRIENDS_SHOWN} friends`, async () => {
    const friends = Array.from({ length: 12 }, (_, index) =>
      makeUserFriend({ id: `f${index}`, displayName: `Friend ${index}` }),
    );
    const { screenPromise } = renderSection({ count: 12, friends });
    const screen = await screenPromise;

    expect(screen.getAllByTestId(/^profile-friend-f\d+$/)).toHaveLength(
      PROFILE_FRIENDS_SHOWN,
    );
  });

  it('opens a friend, or the whole list', async () => {
    const { props, screenPromise } = renderSection();
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('profile-friend-away'));
    expect(props.onSelect).toHaveBeenCalledWith(props.friends[0]);
    await fireEvent.press(screen.getByTestId('profile-friends-view-all'));
    expect(props.onViewAll).toHaveBeenCalled();
  });

  it('says so when there are none, without View All', async () => {
    const { screenPromise } = renderSection({ count: 0, friends: [] });
    const screen = await screenPromise;

    expect(screen.getByTestId('profile-friends-empty')).toBeTruthy();
    expect(screen.getByText('Their friends will show up here.')).toBeTruthy();
    expect(screen.queryByTestId('profile-friends-view-all')).toBeNull();
  });

  it('holds their places while loading', async () => {
    const { screenPromise } = renderSection({ friends: null });
    const screen = await screenPromise;

    expect(screen.getByTestId('profile-friends-loading')).toBeTruthy();
  });
});
