import { fireEvent, render } from '@testing-library/react-native';

import BlockedPlayers from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { getBlockedUsers, unblockUser } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getBlockedUsers: jest.fn(),
  unblockUser: jest.fn(),
}));

const BOB = {
  id: 'u2',
  username: 'bob',
  displayName: 'Bob',
  avatarColor: '#123456',
  blockedAt: '2026-11-23T10:00:00Z',
};

describe('BlockedPlayers', () => {
  beforeEach(() => {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
  });
  afterEach(() => jest.clearAllMocks());

  it('lists the players blocked, and unblocks one at once', async () => {
    (getBlockedUsers as jest.Mock).mockResolvedValue([BOB]);
    (unblockUser as jest.Mock).mockResolvedValue(undefined);
    const screen = await render(<BlockedPlayers />);

    expect(await screen.findByTestId('blocked-player-bob')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('unblock-bob'));

    expect(unblockUser).toHaveBeenCalledWith('bob', 'access-token');
    expect(screen.queryByTestId('blocked-player-bob')).toBeNull();
  });

  it('says when nobody is blocked', async () => {
    (getBlockedUsers as jest.Mock).mockResolvedValue([]);
    const screen = await render(<BlockedPlayers />);
    expect(await screen.findByTestId('blocked-players-empty')).toBeTruthy();
  });
});
