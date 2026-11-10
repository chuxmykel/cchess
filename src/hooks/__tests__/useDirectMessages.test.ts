import { act, renderHook } from '@testing-library/react-native';

import { useDirectMessages } from '../useDirectMessages';
import { useAuthSession } from '../../context/AuthSessionContext';
import {
  ApiError,
  clearMessages,
  getMessages,
  getTheirLastReadAt,
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
  getTheirLastReadAt: jest.fn(),
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
    (getTheirLastReadAt as jest.Mock).mockResolvedValue(null);
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

    expect(sendMessage).toHaveBeenCalledWith(
      'judit',
      { text: 'Hi!' },
      'access-token',
    );
    expect(result.current.messages.filter((m) => m.id === 'mine')).toEqual([
      expect.objectContaining({ delivery: 'sent' }),
    ]);
    expect(result.current.messages).toHaveLength(3);
  });

  it('shows a message as it goes, before the server has it', async () => {
    let deliver!: (message: unknown) => void;
    (sendMessage as jest.Mock).mockReturnValue(
      new Promise((resolve) => (deliver = resolve)),
    );
    const { result } = await renderMessages();

    let sending!: Promise<unknown>;
    await act(async () => {
      sending = result.current.send('On my way');
    });

    expect(result.current.messages.at(-1)).toMatchObject({
      text: 'On my way',
      senderId: 'user-1',
      delivery: 'sending',
    });
    await act(async () => {
      deliver(
        makeDirectMessage({
          id: 'sent',
          senderId: 'user-1',
          text: 'On my way',
        }),
      );
      await sending;
    });
    expect(result.current.messages.at(-1)).toMatchObject({
      id: 'sent',
      delivery: 'sent',
    });
  });

  it('takes the push of my own message in place of the one on its way', async () => {
    (sendMessage as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { result } = await renderMessages();

    await act(async () => {
      void result.current.send('Quick');
    });
    await act(() =>
      fake.trigger(
        'dm:message',
        makeDirectMessage({
          id: 'echo',
          senderId: 'user-1',
          recipientId: 'friend-1',
          text: 'Quick',
          createdAt: '2026-10-27T12:00:00.000Z',
        }),
      ),
    );

    expect(result.current.messages.map((m) => [m.id, m.delivery])).toEqual([
      ['older', 'sent'],
      ['newer', 'sent'],
      ['echo', 'sent'],
    ]);
  });

  it("keeps a message that didn't send, with the server's reason, to retry", async () => {
    (sendMessage as jest.Mock).mockRejectedValueOnce(
      new ApiError(403, 'You can only message friends'),
    );
    const { result } = await renderMessages();

    let outcome!: { failure: string | null };
    await act(async () => {
      outcome = await result.current.send('Hello?');
    });

    expect(outcome.failure).toBe('You can only message friends');
    const failed = result.current.messages.at(-1)!;
    expect(failed).toMatchObject({ text: 'Hello?', delivery: 'failed' });

    (sendMessage as jest.Mock).mockResolvedValueOnce(
      makeDirectMessage({
        id: 'second-try',
        senderId: 'user-1',
        text: 'Hello?',
      }),
    );
    await act(async () => {
      outcome = await result.current.retry(failed.id);
    });
    expect(outcome.failure).toBeNull();
    expect(result.current.messages.at(-1)).toMatchObject({
      id: 'second-try',
      delivery: 'sent',
    });
    expect(result.current.messages).toHaveLength(3);
  });

  it('says nothing more than that it failed when the server is out of reach', async () => {
    (sendMessage as jest.Mock).mockRejectedValueOnce(
      new ApiError(0, 'Network Error'),
    );
    const { result } = await renderMessages();

    let outcome!: { failure: string | null };
    await act(async () => {
      outcome = await result.current.send('Hello?');
    });

    expect(outcome.failure).toBeNull();
    expect(result.current.messages.at(-1)?.delivery).toBe('failed');
  });

  it('sends a game with no text', async () => {
    (sendMessage as jest.Mock).mockResolvedValue(
      makeDirectMessage({ id: 'game', senderId: 'user-1', text: '' }),
    );
    const { result } = await renderMessages();

    await act(() =>
      result.current.send('', { kind: 'game', gameId: 'game-1' }),
    );

    expect(sendMessage).toHaveBeenCalledWith(
      'judit',
      { text: '', attachment: { kind: 'game', gameId: 'game-1' } },
      'access-token',
    );
  });

  it('sends nothing for an empty message', async () => {
    const { result } = await renderMessages();

    await act(() => result.current.send('   '));

    expect(sendMessage).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(2);
  });

  it('knows when they last read my messages, and as they read more', async () => {
    (getTheirLastReadAt as jest.Mock).mockResolvedValue(
      '2026-10-27T10:30:00.000Z',
    );
    const { result } = await renderMessages();

    expect(getTheirLastReadAt).toHaveBeenCalledWith('judit', 'access-token');
    expect(result.current.theirLastReadAt).toBe('2026-10-27T10:30:00.000Z');

    await act(() =>
      fake.trigger('dm:read', {
        userId: 'someone-else',
        readAt: '2026-10-27T11:00:00.000Z',
      }),
    );
    expect(result.current.theirLastReadAt).toBe('2026-10-27T10:30:00.000Z');
    await act(() =>
      fake.trigger('dm:read', {
        userId: 'friend-1',
        readAt: '2026-10-27T12:00:00.000Z',
      }),
    );
    expect(result.current.theirLastReadAt).toBe('2026-10-27T12:00:00.000Z');
  });

  it('clears the conversation', async () => {
    (clearMessages as jest.Mock).mockResolvedValue(undefined);
    const { result } = await renderMessages();

    await act(() => result.current.clear());

    expect(clearMessages).toHaveBeenCalledWith('judit', 'access-token');
    expect(result.current.messages).toEqual([]);
  });
});
