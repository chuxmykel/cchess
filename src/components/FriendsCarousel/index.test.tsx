import { fireEvent, render } from '@testing-library/react-native';

import FriendsCarousel from '.';
import { makeFriend } from '../../testUtils/social';

jest.mock('../../hooks/usePopoverMenu', () =>
  jest.requireActual('../../testUtils/popoverMenuStartingOpen'),
);

describe('FriendsCarousel', () => {
  const away = makeFriend({
    id: 'away',
    displayName: 'Away',
    lastSeenAt: '2026-10-20T10:00:00.000Z',
  });
  const playing = makeFriend({
    id: 'playing',
    displayName: 'Playing',
    online: true,
    playingGameId: 'game-1',
  });

  function renderCarousel(
    overrides: Partial<React.ComponentProps<typeof FriendsCarousel>> = {},
  ) {
    const props = {
      friends: [away, playing],
      unreadByUserId: {},
      onSeeAll: jest.fn(),
      onFindFriends: jest.fn(),
      onPress: jest.fn(),
      onMessage: jest.fn(),
      onChallenge: jest.fn(),
      onWatch: jest.fn(),
      ...overrides,
    };
    return { props, screenPromise: render(<FriendsCarousel {...props} />) };
  }

  it('shows friends who are playing first, with their status', async () => {
    const { screenPromise } = renderCarousel();
    const screen = await screenPromise;

    expect(
      screen.getAllByTestId(/^friend-card-/).map((card) => card.props.testID),
    ).toEqual(['friend-card-playing', 'friend-card-away']);
    expect(screen.getByText('Playing right now')).toBeTruthy();
  });

  it('messages and challenges a friend from the card menu', async () => {
    const { props, screenPromise } = renderCarousel({ friends: [away] });
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('friend-message-away'));
    expect(props.onMessage).toHaveBeenCalledWith(away);
  });

  it("counts a friend's unread messages on their card", async () => {
    const { screenPromise } = renderCarousel({ unreadByUserId: { away: 3 } });
    const screen = await screenPromise;

    expect(screen.getByTestId('friend-unread-away')).toHaveTextContent('3');
  });

  it('shows nothing while friends are loading', async () => {
    const { screenPromise } = renderCarousel({ friends: null });
    const screen = await screenPromise;

    expect(screen.queryByTestId('friends-see-all')).toBeNull();
  });
});
