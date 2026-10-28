import { act, fireEvent, render } from '@testing-library/react-native';

import UserFriends from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { getUserFriends, UserFriend } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { makeUserFriend } from '../../testUtils/social';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../hooks/usePopoverMenu', () =>
  jest.requireActual('../../testUtils/popoverMenuStartingOpen'),
);
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getUserFriends: jest.fn(),
}));

describe('UserFriends', () => {
  const bea = makeUserFriend({
    id: 'bea',
    username: 'bea',
    displayName: 'Bea',
    friendsSince: '2026-03-01T00:00:00.000Z',
  });
  const cal = makeUserFriend({
    id: 'cal',
    username: 'cal',
    displayName: 'Cal',
    online: true,
    friendsSince: '2026-01-01T00:00:00.000Z',
  });
  const amy = makeUserFriend({
    id: 'amy',
    username: 'amy',
    displayName: 'Amy',
    lastSeenAt: '2026-10-01T00:00:00.000Z',
    friendsSince: '2025-12-01T00:00:00.000Z',
  });

  async function renderScreen(friends: UserFriend[] | Error = [bea, cal, amy]) {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
    if (friends instanceof Error) {
      (getUserFriends as jest.Mock).mockRejectedValue(friends);
    } else {
      (getUserFriends as jest.Mock).mockResolvedValue(friends);
    }
    const navigation = { push: jest.fn(), setOptions: jest.fn() };
    const screen = await render(
      <UserFriends
        navigation={navigation as never}
        route={{
          key: 'k',
          name: 'UserFriends',
          params: { username: 'judit', displayName: 'Judit Polgar' },
        }}
      />,
    );
    await act(async () => {});
    return { screen, navigation };
  }

  const rowOrder = (
    screen: Awaited<ReturnType<typeof renderScreen>>['screen'],
  ) =>
    screen
      .getAllByTestId(/^friend-row-(amy|bea|cal)$/)
      .map((row) => row.props.testID.replace('friend-row-', ''));

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("titles the screen with the player's name", async () => {
    const { navigation } = await renderScreen();

    expect(getUserFriends).toHaveBeenCalledWith('judit', 'access-token');
    expect(navigation.setOptions).toHaveBeenCalledWith({
      title: "Judit Polgar's friends",
    });
  });

  it('lists online friends first, then sorts by name or when added', async () => {
    const { screen } = await renderScreen();

    // Online, then the most recently active.
    expect(rowOrder(screen)).toEqual(['cal', 'bea', 'amy']);
    await fireEvent.press(screen.getByTestId('friends-sort-alphabetical'));
    expect(rowOrder(screen)).toEqual(['amy', 'bea', 'cal']);
    await fireEvent.press(screen.getByTestId('friends-sort'));
    await fireEvent.press(screen.getByTestId('friends-sort-recent'));
    expect(rowOrder(screen)).toEqual(['bea', 'cal', 'amy']);
  });

  it('shows only the friends online, when asked', async () => {
    const { screen } = await renderScreen();

    expect(screen.getByTestId('friends-online-filter')).toHaveTextContent(
      /Online 1/,
    );
    await fireEvent.press(screen.getByTestId('friends-online-filter'));
    expect(rowOrder(screen)).toEqual(['cal']);
    await fireEvent.press(screen.getByTestId('friends-online-filter'));
    expect(rowOrder(screen)).toEqual(['cal', 'bea', 'amy']);
  });

  it('says so when none of them are online', async () => {
    const { screen } = await renderScreen([bea, amy]);

    await fireEvent.press(screen.getByTestId('friends-online-filter'));

    expect(screen.getByTestId('user-friends-none-online')).toBeTruthy();
  });

  it("opens a friend's profile", async () => {
    const { screen, navigation } = await renderScreen();

    await fireEvent.press(screen.getByTestId('friend-row-bea'));

    expect(navigation.push).toHaveBeenCalledWith('UserProfile', {
      username: 'bea',
    });
  });

  it('says so when they have none', async () => {
    const { screen } = await renderScreen([]);

    expect(screen.getByTestId('user-friends-empty')).toBeTruthy();
    expect(screen.queryByTestId('friends-sort')).toBeNull();
  });

  it('offers to try again when they fail to load', async () => {
    const { screen } = await renderScreen(new Error('offline'));

    expect(screen.getByTestId('user-friends-error')).toBeTruthy();
    (getUserFriends as jest.Mock).mockResolvedValue([bea]);
    await fireEvent.press(screen.getByText('Try again'));
    await act(async () => {});
    expect(screen.getByTestId('friend-row-bea')).toBeTruthy();
  });
});
