import { act, renderHook } from '@testing-library/react-native';

import { CONVERSATIONS_PAGE_SIZE, useConversations } from '../useConversations';
import { useAuthSession } from '../../context/AuthSessionContext';
import {
  clearMessages,
  ConversationSummary,
  getConversations,
  markMessagesRead,
} from '../../network/restClient';
import { makeAuthSession } from '../../testUtils/authSession';
import { createFakeSocket, FakeSocket } from '../../testUtils/fakeSocket';
import { makeDirectMessage } from '../../testUtils/social';

jest.mock('../../context/AuthSessionContext', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('../../network/restClient', () => ({
  ...jest.requireActual('../../network/restClient'),
  getConversations: jest.fn(),
  markMessagesRead: jest.fn(),
  clearMessages: jest.fn(),
}));

function conversation(
  userId: string,
  createdAt: string,
  overrides: Partial<ConversationSummary> = {},
): ConversationSummary {
  return {
    user: {
      id: userId,
      username: userId,
      displayName: userId.toUpperCase(),
      avatarColor: '#123456',
    },
    lastMessage: makeDirectMessage({
      id: `${userId}-last`,
      senderId: userId,
      recipientId: 'user-1',
      createdAt,
    }),
    unreadCount: 0,
    theirLastReadAt: null,
    ...overrides,
  };
}

const ANA = conversation('ana', '2026-10-27T12:00:00.000Z');
const BO = conversation('bo', '2026-10-27T11:00:00.000Z');

describe('useConversations', () => {
  let fake: FakeSocket;

  function signIn(user: { isGuest?: boolean } = {}) {
    fake = createFakeSocket();
    (useAuthSession as jest.Mock).mockReturnValue(
      makeAuthSession({
        user: { id: 'user-1', isGuest: false, ...user },
        socket: fake.socket,
      }),
    );
  }

  async function renderInbox() {
    const rendered = await renderHook(() => useConversations());
    await act(async () => {});
    return rendered;
  }

  beforeEach(() => {
    signIn();
    (getConversations as jest.Mock).mockResolvedValue([ANA, BO]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads the first page, newest message first', async () => {
    const { result } = await renderInbox();

    expect(getConversations).toHaveBeenCalledWith(
      { limit: CONVERSATIONS_PAGE_SIZE },
      'access-token',
    );
    expect(result.current.status).toBe('ready');
    expect(result.current.conversations?.map((c) => c.user.id)).toEqual([
      'ana',
      'bo',
    ]);
    expect(result.current.hasMore).toBe(false);
  });

  it('pages on from the last one shown, once there may be more', async () => {
    const full = Array.from({ length: CONVERSATIONS_PAGE_SIZE }, (_, index) =>
      conversation(
        `p${index}`,
        `2026-10-27T10:${String(59 - index).padStart(2, '0')}:00.000Z`,
      ),
    );
    (getConversations as jest.Mock).mockResolvedValueOnce(full);
    const { result } = await renderInbox();
    (getConversations as jest.Mock).mockResolvedValueOnce([BO]);

    expect(result.current.hasMore).toBe(true);
    await act(async () => result.current.loadMore());

    expect(getConversations).toHaveBeenLastCalledWith(
      {
        limit: CONVERSATIONS_PAGE_SIZE,
        before: full.at(-1)!.lastMessage.createdAt,
      },
      'access-token',
    );
    expect(result.current.conversations?.at(-1)?.user.id).toBe('bo');
    expect(result.current.hasMore).toBe(false);
  });

  it('moves a conversation to the top with its new message', async () => {
    const { result } = await renderInbox();
    const pushed = makeDirectMessage({
      id: 'new',
      senderId: 'user-1',
      recipientId: 'bo',
      text: 'Still there?',
      createdAt: '2026-10-27T13:00:00.000Z',
    });

    await act(() => fake.trigger('dm:message', pushed));

    expect(result.current.conversations?.map((c) => c.user.id)).toEqual([
      'bo',
      'ana',
    ]);
    expect(result.current.conversations?.[0].lastMessage).toEqual(pushed);
    expect(getConversations).toHaveBeenCalledTimes(1);
  });

  it('fetches the list again for a message from someone not in it', async () => {
    await renderInbox();

    await act(() =>
      fake.trigger(
        'dm:message',
        makeDirectMessage({ senderId: 'new-friend', recipientId: 'user-1' }),
      ),
    );

    expect(getConversations).toHaveBeenCalledTimes(2);
  });

  it('notes when they read my messages', async () => {
    const { result } = await renderInbox();

    await act(() =>
      fake.trigger('dm:read', {
        userId: 'ana',
        readAt: '2026-10-27T12:30:00.000Z',
      }),
    );

    expect(result.current.conversations?.[0].theirLastReadAt).toBe(
      '2026-10-27T12:30:00.000Z',
    );
    expect(result.current.conversations?.[1].theirLastReadAt).toBeNull();
  });

  it('marks one read, and removes one for me', async () => {
    (markMessagesRead as jest.Mock).mockResolvedValue(undefined);
    (clearMessages as jest.Mock).mockResolvedValue(undefined);
    const { result } = await renderInbox();

    await act(() => result.current.markRead(ANA));
    await act(() => result.current.remove(BO));

    expect(markMessagesRead).toHaveBeenCalledWith('ana', 'access-token');
    expect(clearMessages).toHaveBeenCalledWith('bo', 'access-token');
    expect(result.current.conversations?.map((c) => c.user.id)).toEqual([
      'ana',
    ]);
  });

  it('keeps what it showed when refreshing fails, but says so first time round', async () => {
    (getConversations as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    const { result } = await renderInbox();
    expect(result.current.status).toBe('error');

    await act(() => result.current.reload());
    expect(result.current.status).toBe('ready');
    (getConversations as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    await act(() => result.current.reload());

    expect(result.current.status).toBe('ready');
    expect(result.current.conversations).toHaveLength(2);
  });

  it('has nothing to fetch for a guest', async () => {
    signIn({ isGuest: true });
    const { result } = await renderInbox();

    expect(getConversations).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({
      status: 'ready',
      conversations: [],
    });
  });
});
