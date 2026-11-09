import { act, fireEvent, render } from '@testing-library/react-native';

import ExplorerSettingsSheet from '.';
import {
  DEFAULT_EXPLORER_SETTINGS,
  ExplorerSettings,
} from '../../constants/explorer';
import { useAuthSession } from '../../context/AuthSessionContext';
import { USER_SEARCH_DELAY_MS } from '../../hooks/useUserSearch';
import { searchUsers } from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { withSafeArea } from '../../testUtils/safeArea';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  searchUsers: jest.fn(),
}));

const JUDIT = {
  id: 'judit-id',
  username: 'judit',
  displayName: 'Judit Polgar',
  avatarColor: '#D64545',
};

async function renderSheet(change: Partial<ExplorerSettings> = {}) {
  const onChange = jest.fn();
  const screen = await render(
    withSafeArea(
      <ExplorerSettingsSheet
        visible
        onClose={jest.fn()}
        settings={{ ...DEFAULT_EXPLORER_SETTINGS, ...change }}
        onChange={onChange}
      />,
    ),
  );
  return { ...screen, onChange };
}

describe('ExplorerSettingsSheet', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (useAuthSession as jest.Mock).mockReturnValue(makeAuthSession());
    (searchUsers as jest.Mock).mockResolvedValue([JUDIT]);
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('picks the database', async () => {
    const { getByTestId, onChange } = await renderSheet();

    expect(getByTestId('explorer-db-lichess').props.accessibilityState).toEqual(
      { checked: true },
    );
    await fireEvent.press(getByTestId('explorer-db-masters'));

    expect(onChange).toHaveBeenCalledWith({ db: 'masters' });
  });

  it("toggles the Lichess database's time controls and ratings, keeping one of each", async () => {
    const { getByTestId, onChange } = await renderSheet({
      speeds: ['blitz'],
      ratings: [2000, 2200],
    });

    await fireEvent.press(getByTestId('explorer-speed-bullet'));
    expect(onChange).toHaveBeenLastCalledWith({ speeds: ['bullet', 'blitz'] });

    await fireEvent.press(getByTestId('explorer-speed-blitz'));
    expect(onChange).toHaveBeenLastCalledWith({ speeds: ['blitz'] });

    await fireEvent.press(getByTestId('explorer-rating-2000'));
    expect(onChange).toHaveBeenLastCalledWith({ ratings: [2200] });
  });

  it('shows no filters for Masters', async () => {
    const { queryByTestId } = await renderSheet({ db: 'masters' });

    expect(queryByTestId('explorer-speed-blitz')).toBeNull();
  });

  it('looks in your games, or picks another player by search', async () => {
    const { getByTestId, onChange } = await renderSheet({ db: 'player' });
    expect(getByTestId('explorer-player')).toHaveTextContent('You');

    await fireEvent.press(getByTestId('explorer-player-change'));
    await fireEvent.changeText(getByTestId('user-search-input'), 'jud');
    await act(async () => {
      jest.advanceTimersByTime(USER_SEARCH_DELAY_MS);
    });
    await fireEvent.press(getByTestId('user-search-result-judit'));

    expect(onChange).toHaveBeenCalledWith({
      player: { id: 'judit-id', username: 'judit' },
    });
    expect(getByTestId('explorer-player')).toBeTruthy();
  });

  it('goes back to your games, and picks the side played', async () => {
    const { getByTestId, onChange } = await renderSheet({
      db: 'player',
      player: { id: 'judit-id', username: 'judit' },
    });
    expect(getByTestId('explorer-player')).toHaveTextContent('@judit');

    await fireEvent.press(getByTestId('explorer-player-me'));
    expect(onChange).toHaveBeenLastCalledWith({ player: null });

    await fireEvent.press(getByTestId('explorer-color-black'));
    expect(onChange).toHaveBeenLastCalledWith({ color: 'black' });
  });
});
