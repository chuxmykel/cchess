import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import ActionSheet, { ActionSheetAction } from '../../components/ActionSheet';
import ConversationRow from '../../components/ConversationRow';
import EmptyState from '../../components/EmptyState';
import FriendPickerSheet from '../../components/FriendPickerSheet';
import Icon from '../../components/Icon';
import OnlineFriendsStrip from '../../components/OnlineFriendsStrip';
import { presenceOf } from '../../components/PresenceAvatar';
import SignInPrompt from '../../components/SignInPrompt';
import Toast from '../../components/Toast';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useSocialContext } from '../../context/SocialContext';
import { useConversations } from '../../hooks/useConversations';
import { useNow } from '../../hooks/useNow';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useToast } from '../../hooks/useToast';
import { useTypingFriends } from '../../hooks/useTyping';
import { ConversationSummary, Friend } from '../../network/restClient';
import { MessagesStackScreenProps } from '../MessagesStack/types';
import { plainHeaderItem } from '../plainHeaderOptions';
import { makeStyles, useTheme } from '../../theme';

type MessagesProps = {
  navigation: Pick<
    MessagesStackScreenProps<'Messages'>['navigation'],
    'navigate' | 'setOptions'
  >;
};

const MINUTE_MS = 60_000;

/** The person a conversation's with, as the Conversation screen takes. */
function partnerOf(user: {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
}) {
  return {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarColor: user.avatarColor,
  };
}

// The Messages tab: everyone you have messages with, the newest first -
// who's typing, what's unread, whether they've seen yours - with the
// friends around right now across the top, and a new message a tap away.
const Messages: React.FC<MessagesProps> = ({ navigation }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const session = useAuthSession();
  const social = useSocialContext();
  const inbox = useConversations();
  const typing = useTypingFriends();
  const toast = useToast();
  const now = new Date(useNow(MINUTE_MS));
  const [query, setQuery] = useState('');
  const [isPickingFriend, setIsPickingFriend] = useState(false);
  const [menuFor, setMenuFor] = useState<ConversationSummary | null>(null);
  const user = session.isReady ? session.user : null;
  const canMessage = user !== null && !user.isGuest;

  const { reload } = inbox;
  const reloadSocial = social.reload;
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );
  const refresh = usePullToRefresh(reload, reloadSocial);

  useLayoutEffect(() => {
    navigation.setOptions({
      unstable_headerRightItems: () =>
        canMessage
          ? [
              plainHeaderItem(
                <Pressable
                  onPress={() => setIsPickingFriend(true)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="New message"
                  testID="new-message-button"
                >
                  <Icon name="pencil-box-outline" size={26} />
                </Pressable>,
              ),
            ]
          : [],
    });
  }, [navigation, canMessage]);

  const friendsById = useMemo(
    () => new Map((social.friends ?? []).map((friend) => [friend.id, friend])),
    [social.friends],
  );
  const shown = useMemo(() => {
    const wanted = query.trim().toLowerCase();
    return (inbox.conversations ?? []).filter(
      ({ user: other }) =>
        !wanted ||
        other.displayName.toLowerCase().includes(wanted) ||
        other.username.toLowerCase().includes(wanted),
    );
  }, [inbox.conversations, query]);

  function open(partner: ReturnType<typeof partnerOf>) {
    navigation.navigate('Conversation', partner);
  }

  function openFriend(friend: Friend) {
    setIsPickingFriend(false);
    open(partnerOf(friend));
  }

  function confirmDelete(conversation: ConversationSummary) {
    Alert.alert(
      `Delete your conversation with ${conversation.user.displayName}?`,
      'It will be removed for you only.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            social.markConversationRead(conversation.user.id);
            inbox
              .remove(conversation)
              .catch((error: Error) => toast.show(error.message));
          },
        },
      ],
    );
  }

  function menuActions(conversation: ConversationSummary): ActionSheetAction[] {
    const unread = social.unreadByUserId[conversation.user.id] ?? 0;
    return [
      ...(unread > 0
        ? [
            {
              label: 'Mark as read',
              immediate: true,
              onPress: () => {
                social.markConversationRead(conversation.user.id);
                inbox.markRead(conversation).catch(() => {});
              },
              testID: 'conversation-menu-mark-read',
            },
          ]
        : []),
      {
        label: 'View profile',
        onPress: () =>
          navigation.navigate('UserProfile', {
            username: conversation.user.username,
          }),
        testID: 'conversation-menu-profile',
      },
      {
        label: 'Delete conversation',
        destructive: true,
        onPress: () => confirmDelete(conversation),
        testID: 'conversation-menu-delete',
      },
    ];
  }

  if (!user) {
    return <View style={styles.screen} testID="messages-screen" />;
  }
  if (!canMessage) {
    return (
      <View style={[styles.screen, styles.centered]} testID="messages-screen">
        <EmptyState
          illustration="messages"
          title="Message your friends"
          message="Sign in to add friends, chat about your games and send them positions."
        />
        <SignInPrompt
          onSignIn={() => navigation.navigate('SignIn')}
          onCreateAccount={() => navigation.navigate('CreateAccount')}
        />
      </View>
    );
  }

  const hasFriends = (social.friends?.length ?? 0) > 0;
  const isSearching = query.trim() !== '';
  const header = (
    <View>
      <View style={styles.search}>
        <Icon name="magnify" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search messages"
          placeholderTextColor={colors.textFaint}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
          accessibilityLabel="Search messages"
          testID="messages-search"
        />
      </View>
      {!isSearching && (
        <OnlineFriendsStrip
          friends={social.friends ?? []}
          onPress={openFriend}
        />
      )}
    </View>
  );

  return (
    <View style={styles.screen} testID="messages-screen">
      <FlatList
        data={shown}
        keyExtractor={(conversation) => conversation.user.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <ConversationRow
            conversation={item}
            myUserId={user.id}
            unreadCount={social.unreadByUserId[item.user.id] ?? 0}
            presence={presenceOf(friendsById.get(item.user.id))}
            isTyping={typing.has(item.user.id)}
            now={now}
            onPress={(conversation) => open(partnerOf(conversation.user))}
            onLongPress={setMenuFor}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          inbox.status === 'loading' ? null : inbox.status === 'error' ? (
            <Text style={styles.error}>
              {"Your messages couldn't be loaded. Pull down to try again."}
            </Text>
          ) : isSearching ? (
            <Text style={styles.noMatch} testID="messages-no-match">
              No conversations match “{query.trim()}”
            </Text>
          ) : (
            <EmptyState
              illustration="messages"
              title="No messages yet"
              message={
                hasFriends
                  ? 'Say hello to a friend - your conversations will show up here.'
                  : 'Add friends to chat about your games and send them positions.'
              }
              action={
                hasFriends
                  ? {
                      label: 'New message',
                      onPress: () => setIsPickingFriend(true),
                      testID: 'messages-empty-new',
                    }
                  : {
                      label: 'Find friends',
                      onPress: () =>
                        navigation.navigate('FindFriends', {
                          focusSearch: true,
                        }),
                      testID: 'messages-empty-find-friends',
                    }
              }
              testID="messages-empty"
            />
          )
        }
        onEndReached={inbox.loadMore}
        onEndReachedThreshold={0.5}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl {...refresh} />}
        testID="conversation-list"
      />
      <FriendPickerSheet
        visible={isPickingFriend}
        title="New message"
        friends={social.friends}
        onPick={openFriend}
        onClose={() => setIsPickingFriend(false)}
      />
      <ActionSheet
        visible={menuFor !== null}
        onClose={() => setMenuFor(null)}
        actions={menuFor ? menuActions(menuFor) : []}
      />
      <Toast toasts={toast.toasts} />
    </View>
  );
};

export default Messages;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  centered: {
    justifyContent: 'center',
    gap: t.spacing.lg,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    marginHorizontal: t.spacing.lg,
    marginTop: t.spacing.sm,
    marginBottom: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
  },
  searchInput: {
    flex: 1,
    paddingVertical: t.spacing.md,
    color: t.colors.text,
    fontSize: t.fontSize.lg,
  },
  separator: {
    height: 1,
    marginLeft: t.spacing.lg + 52 + t.spacing.md,
    backgroundColor: t.colors.divider,
  },
  error: {
    marginTop: t.spacing.xl,
    paddingHorizontal: t.spacing.xl,
    textAlign: 'center',
    color: t.colors.textMuted,
  },
  noMatch: {
    marginTop: t.spacing.xl,
    textAlign: 'center',
    color: t.colors.textMuted,
  },
}));
