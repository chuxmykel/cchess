import { fireEvent, render } from '@testing-library/react-native';

import FriendListControls from '.';

jest.mock('../../hooks/usePopoverMenu', () =>
  jest.requireActual('../../testUtils/popoverMenuStartingOpen'),
);

describe('FriendListControls', () => {
  function renderControls(
    overrides: Partial<React.ComponentProps<typeof FriendListControls>> = {},
  ) {
    const props = {
      sort: 'online' as const,
      onSortChange: jest.fn(),
      onlineOnly: false,
      onOnlineOnlyChange: jest.fn(),
      onlineCount: 3,
      ...overrides,
    };
    return { props, screenPromise: render(<FriendListControls {...props} />) };
  }

  it('names the order shown and ticks it in the menu', async () => {
    const { screenPromise } = renderControls({ sort: 'recent' });
    const screen = await screenPromise;

    expect(screen.getByTestId('friends-sort')).toHaveTextContent(
      /Recently added/,
    );
    expect(screen.getByTestId('friends-sort-recent')).toBeSelected();
    expect(screen.getByTestId('friends-sort-online')).not.toBeSelected();
  });

  it('switches the order, closing the menu', async () => {
    const { props, screenPromise } = renderControls();
    const screen = await screenPromise;

    await fireEvent.press(screen.getByTestId('friends-sort-alphabetical'));

    expect(props.onSortChange).toHaveBeenCalledWith('alphabetical');
    expect(screen.queryByTestId('friends-sort-alphabetical')).toBeNull();
  });

  it('counts who is online and toggles showing only them', async () => {
    const { props, screenPromise } = renderControls();
    const screen = await screenPromise;
    const filter = screen.getByTestId('friends-online-filter');

    expect(filter).toHaveTextContent(/Online 3/);
    expect(filter).not.toBeSelected();
    await fireEvent.press(filter);
    expect(props.onOnlineOnlyChange).toHaveBeenCalledWith(true);
  });

  it('shows the filter on, and turns it off', async () => {
    const { props, screenPromise } = renderControls({ onlineOnly: true });
    const screen = await screenPromise;

    expect(screen.getByTestId('friends-online-filter')).toBeSelected();
    await fireEvent.press(screen.getByTestId('friends-online-filter'));
    expect(props.onOnlineOnlyChange).toHaveBeenCalledWith(false);
  });
});
