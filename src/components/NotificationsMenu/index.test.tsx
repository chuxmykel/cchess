import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import NotificationsMenu from '.';

describe('NotificationsMenu', () => {
  function renderMenu(
    props: Partial<React.ComponentProps<typeof NotificationsMenu>> = {},
  ) {
    return render(
      <NotificationsMenu
        count={0}
        isEmpty={false}
        visible={false}
        onOpen={jest.fn()}
        onClose={jest.fn()}
        {...props}
      >
        <Text>A challenge</Text>
      </NotificationsMenu>,
    );
  }

  it('counts the notifications on the bell, capping the badge at 9+', async () => {
    const screen = await renderMenu({ count: 3 });
    expect(screen.getByTestId('notifications-badge')).toHaveTextContent('3');

    await screen.rerender(
      <NotificationsMenu
        count={12}
        isEmpty={false}
        visible={false}
        onOpen={jest.fn()}
        onClose={jest.fn()}
      >
        {null}
      </NotificationsMenu>,
    );
    expect(screen.getByTestId('notifications-badge')).toHaveTextContent('9+');
  });

  it('hides the badge with nothing to answer', async () => {
    const screen = await renderMenu();

    expect(screen.queryByTestId('notifications-badge')).toBeNull();
  });

  it('opens from the bell', async () => {
    const onOpen = jest.fn();
    const screen = await renderMenu({ onOpen });

    await fireEvent.press(screen.getByTestId('notifications-button'));

    expect(onOpen).toHaveBeenCalled();
  });

  it('lists the notifications while open', async () => {
    const screen = await renderMenu({ visible: true });

    expect(screen.getByText('A challenge')).toBeTruthy();
  });

  it('says so when there are none', async () => {
    const screen = await renderMenu({ visible: true, isEmpty: true });

    expect(screen.getByTestId('notifications-empty')).toBeTruthy();
    expect(screen.queryByText('A challenge')).toBeNull();
  });
});
