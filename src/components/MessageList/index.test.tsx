import { fireEvent, render } from '@testing-library/react-native';

import MessageList from '.';
import { makeDirectMessage } from '../../testUtils/social';

describe('MessageList', () => {
  it('groups messages by day and tells mine from theirs', async () => {
    const screen = await render(
      <MessageList
        otherName="Judit"
        messages={[
          makeDirectMessage({
            id: 'a',
            text: 'Playyyy!!',
            createdAt: '2026-09-27T11:37:00.000Z',
          }),
          makeDirectMessage({
            id: 'b',
            senderId: 'user-1',
            text: 'Sure',
            createdAt: '2026-09-28T15:39:00.000Z',
          }),
        ]}
        myUserId="user-1"
        hasOlder={false}
        onLoadOlder={jest.fn()}
      />,
    );

    expect(screen.getByText('Sep 27, 2026')).toBeTruthy();
    expect(screen.getByText('Sep 28, 2026')).toBeTruthy();
    expect(screen.getByTestId('message-b')).toHaveStyle({
      alignSelf: 'flex-end',
    });
    expect(screen.getByTestId('message-a')).toHaveStyle({
      alignSelf: 'flex-start',
    });
  });

  it('invites a first message to the friend', async () => {
    const screen = await render(
      <MessageList
        otherName="Judit"
        messages={[]}
        myUserId="user-1"
        hasOlder={false}
        onLoadOlder={jest.fn()}
      />,
    );

    expect(screen.getByTestId('messages-empty')).toHaveTextContent(
      /Say hello to Judit!/,
    );
  });

  it('loads earlier messages when there are more', async () => {
    const onLoadOlder = jest.fn();
    const screen = await render(
      <MessageList
        otherName="Judit"
        messages={[]}
        myUserId="user-1"
        hasOlder
        onLoadOlder={onLoadOlder}
      />,
    );

    await fireEvent.press(screen.getByTestId('load-older-messages'));

    expect(onLoadOlder).toHaveBeenCalled();
  });
});
