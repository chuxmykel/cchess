import { act, fireEvent, render } from '@testing-library/react-native';

import Badges from '.';
import { useAuthSession } from '../../context/AuthSessionContext';
import { claimBadge, getBadges } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { makeBadge } from '../../testUtils/badges';
import { withSafeArea } from '../../testUtils/safeArea';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getBadges: jest.fn(),
  claimBadge: jest.fn(),
}));

describe('Badges', () => {
  async function renderBadges(username = 'guest_1234') {
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
    const navigation = { navigate: jest.fn() };
    const screen = await render(
      withSafeArea(
        <Badges
          navigation={navigation as never}
          route={{ params: { username, displayName: 'Judit' } } as never}
        />,
      ),
    );
    await act(async () => {});
    return { screen, navigation };
  }

  afterEach(() => jest.clearAllMocks());

  it('shows every badge as a grid in its groups, the unearned faded', async () => {
    (getBadges as jest.Mock).mockResolvedValue([
      makeBadge({ id: 'a' }),
      makeBadge({ id: 'b', game: null }),
      makeBadge({
        id: 'm',
        kind: 'ratingReached',
        category: 'blitz',
        value: 1600,
      }),
    ]);
    const { screen } = await renderBadges();

    expect(screen.getByTestId('badges-earned')).toHaveTextContent(
      '2 badges earned',
    );
    expect(screen.getByTestId('badges-comeback-count')).toHaveTextContent('2');
    expect(screen.getByTestId('badges-ratingReached-blitz-1600')).toBeTruthy();
    expect(screen.getByTestId('badges-gamesPlayed-10')).toHaveProp(
      'accessibilityLabel',
      '10 games, not earned yet',
    );
    expect(screen.getByText('Checkmates')).toBeTruthy();
  });

  it('opens a badge card: its games, and Claim on your own', async () => {
    (getBadges as jest.Mock).mockResolvedValue([makeBadge()]);
    (claimBadge as jest.Mock).mockResolvedValue(
      makeBadge({ claimedAt: '2026-11-06T00:00:00.000Z' }),
    );
    const { screen, navigation } = await renderBadges();

    await fireEvent.press(screen.getByTestId('badges-comeback'));
    expect(screen.getByTestId('badge-card-games')).toHaveTextContent(
      /Won vs Magnus/,
    );
    await fireEvent.press(screen.getByTestId('badge-card-claim'));
    await act(async () => {});
    expect(claimBadge).toHaveBeenCalledWith('badge-1', 'access-token');
    expect(screen.getByTestId('badge-card-close')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('badge-card-game-game-1'));
    expect(navigation.navigate).toHaveBeenCalledWith('GameViewer', {
      gameId: 'game-1',
    });
  });

  it("never offers Claim on someone else's", async () => {
    (getBadges as jest.Mock).mockResolvedValue([makeBadge()]);
    const { screen } = await renderBadges('judit');

    await fireEvent.press(screen.getByTestId('badges-comeback'));
    expect(screen.queryByTestId('badge-card-claim')).toBeNull();
  });

  it('opens a badge not earned yet, saying so', async () => {
    (getBadges as jest.Mock).mockResolvedValue([]);
    const { screen } = await renderBadges();

    await fireEvent.press(screen.getByTestId('badges-smotheredMate'));
    expect(screen.getByTestId('badge-card-earned')).toHaveTextContent(
      'Not earned yet',
    );
  });
});
