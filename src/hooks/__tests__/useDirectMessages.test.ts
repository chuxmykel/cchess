import { act, renderHook } from '@testing-library/react-native';

import { useDirectMessages } from '../useDirectMessages';
import { useAuthSession } from '../../context/AuthSessionContext';
import {
  clearMessages,
  getMessages,
  markMessagesRead,
  sendMessage,
} from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { createFakeSocket, FakeSocket } from '../../testUtils/fakeSocket';
import { makeDirectMessage } from '../../testUtils/social';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getMessages: jest.fn(),
  sendMessage: jest.fn(),
  markMessagesRead: jest.fn(),
  clearMessages: jest.fn(),
}));

const OLDER = makeDirectMessage({
  id: 'older',
  text: 'Older',
  createdAt: '2026-10-27T09:00:00.000Z',
});
const NEWER = makeDirectMessage({
  id: 'newer',
  text: 'Newer',
  createdAt: '2026-10-27T10:00:00.000Z',
});

describe('useDirectMessages', () => {
  let fake: FakeSocket;
  const onRead = jest.fn();

  beforeEach(() => {
    fake = createFakeSocket();
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({ user: { id: 'user-1' }, socket: fake.socket }),
    );
    (getMessages as jest.Mock).mockResolvedValue([NEWER, OLDER]);
    (markMessagesRead as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  async function renderMessages() {
    const rendered = await renderHook(() =>
      useDirectMessages('judit', 'friend-1', onRead),
    );
    await act(async () => {});
    return rendered;
  }

  it('loads the history oldest first and marks it read', async () => {
    const { result } = await renderMessages();

    expect(result.current.status).toBe('ready');
    expect(result.current.messages.map((m) => m.id)).toEqual([
      'older',
      'newer',
    ]);
    expect(markMessagesRead).toHaveBeenCalledWith('judit', 'access-token');
    expect(onRead).toHaveBeenCalled();
  });

  it('adds a message from the friend and marks it read', async () => {
    const { result } = await renderMessages();
    onRead.mockClear();

    await act(() =>
      fake.trigger(
        'dm:message',
        makeDirectMessage({
          id: 'pushed',
          createdAt: '2026-10-27T11:00:00.000Z',
        }),
      ),
    );

    expect(result.current.messages.at(-1)?.id).toBe('pushed');
    expect(onRead).toHaveBeenCalled();
  });

  it("ignores messages from someone else's conversation", async () => {
    const { result } = await renderMessages();

    await act(() =>
      fake.trigger(
        'dm:message',
        makeDirectMessage({ id: 'elsewhere', senderId: 'someone-else' }),
      ),
    );

    expect(result.current.messages).toHaveLength(2);
  });

  it('sends a message, showing it once even when the push echoes it', async () => {
    const sent = makeDirectMessage({
      id: 'mine',
      senderId: 'user-1',
      recipientId: 'friend-1',
      text: 'Hi!',
      createdAt: '2026-10-27T12:00:00.000Z',
    });
    (sendMessage as jest.Mock).mockResolvedValue(sent);
    const { result } = await renderMessages();

    await act(() => result.current.send('  Hi!  '));
    await act(() => fake.trigger('dm:message', sent));

    expect(sendMessage).toHaveBeenCalledWith('judit', 'Hi!', 'access-token');
    expect(result.current.messages.filter((m) => m.id === 'mine')).toHaveLength(
      1,
    );
  });

  it('clears the conversation', async () => {
    (clearMessages as jest.Mock).mockResolvedValue(undefined);
    const { result } = await renderMessages();

    await act(() => result.current.clear());

    expect(clearMessages).toHaveBeenCalledWith('judit', 'access-token');
    expect(result.current.messages).toEqual([]);
  });
});
