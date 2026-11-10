import { act, fireEvent, render } from '@testing-library/react-native';

import GameScreenHeader from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useOptionalSocialContext } from '../../context/SocialContext';
import { sendMessage } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { waitForSheetToClose } from '../../testUtils/modal';
import { withSafeArea } from '../../testUtils/safeArea';
import { makeFriend, makeSocial } from '../../testUtils/social';

// The header's menu starts open, as an anchored popover can't be measured
// here.
jest.mock('../../hooks/usePopoverMenu', () =>
  jest.requireActual('../../testUtils/popoverMenuStartingOpen'),
);
jest.mock('../ConnectionStrengthIndicator', () =>
  jest.requireActual('../../testUtils/ConnectionStrengthIndicatorStub'),
);
jest.mock('../../hooks/useGameShare', () => ({
  useGameShare: () => jest.fn(),
}));
jest.mock('../../hooks/useGameBookmark', () => ({
  useGameBookmark: () => ({ isBookmarked: false, toggleBookmark: jest.fn() }),
}));
jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../context/SocialContext', () => ({
  useOptionalSocialContext: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  sendMessage: jest.fn(),
}));

const FRIEND = makeFriend();

describe('GameScreenHeader', () => {
  async function renderHeader(friends = [FRIEND]) {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
    (useOptionalSocialContext as jest.Mock).mockReturnValue(
      makeSocial({ friends }),
    );
    const onMessage = jest.fn();
    const screen = await render(
      withSafeArea(
        <GameScreenHeader
          gameId="game-1"
          timeControl={{
            type: 'blitz',
            label: '5+0',
            initialSeconds: 300,
            incrementSeconds: 0,
          }}
          rated
          onMessage={onMessage}
        />,
      ),
    );
    return { screen, onMessage };
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sends the game to a friend picked from the menu', async () => {
    (sendMessage as jest.Mock).mockResolvedValue({});
    const { screen, onMessage } = await renderHeader();

    await fireEvent.press(screen.getByTestId('send-game-item'));
    await waitForSheetToClose();
    await fireEvent.press(screen.getByTestId(`friend-row-${FRIEND.id}`));
    await act(async () => {});

    expect(sendMessage).toHaveBeenCalledWith(
      FRIEND.username,
      { text: '', attachment: { kind: 'game', gameId: 'game-1' } },
      'access-token',
    );
    expect(onMessage).toHaveBeenCalledWith(`Sent to ${FRIEND.displayName}`);
  });

  it('offers no sending with no friends to send to', async () => {
    const { screen } = await renderHeader([]);

    expect(screen.queryByTestId('send-game-item')).toBeNull();
    expect(screen.getByTestId('share-game-item')).toBeTruthy();
  });
});
