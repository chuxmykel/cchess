import { useCallback, useLayoutEffect, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ActionSheet, { ActionSheetAction } from '../../components/ActionSheet';
import Button from '../../components/Button';
import ChallengeSheet from '../../components/ChallengeSheet';
import GamePickerSheet from '../../components/GamePickerSheet';
import Icon from '../../components/Icon';
import MessageList from '../../components/MessageList';
import PresenceAvatar, { presenceOf } from '../../components/PresenceAvatar';
import Toast from '../../components/Toast';
import { MAX_DIRECT_MESSAGE_LENGTH } from '../../constants/chat';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useSocialContext } from '../../context/SocialContext';
import { useDirectMessages } from '../../hooks/useDirectMessages';
import { useFriendActions } from '../../hooks/useFriendActions';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';
import { useToast } from '../../hooks/useToast';
import { useSendTyping, useTypingFriends } from '../../hooks/useTyping';
import { MessageAttachment } from '../../network/restClient';
import { presenceLabel } from '../../utils/presence';
import { HomeStackScreenProps } from '../HomeStack/types';
import { plainHeaderItem } from '../plainHeaderOptions';
import { makeStyles, useTheme } from '../../theme';

type ConversationProps = Pick<
  HomeStackScreenProps<'Conversation'>,
  'navigation' | 'route'
>;

const Conversation: React.FC<ConversationProps> = ({ navigation, route }) => {
  const styles = useStyles();
  const { colors } = useTheme();

  const { userId, username, displayName, avatarColor } = route.params;
  const partner = { id: userId, username, displayName, avatarColor };
  const session = useAuthSession();
  const social = useSocialContext();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const [draft, setDraft] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPickingGame, setIsPickingGame] = useState(false);
  const markRead = useCallback(
    () => social.markConversationRead(userId),
    [social, userId],
  );
  const conversation = useDirectMessages(username, userId, markRead);
  const typing = useTypingFriends();
  const sendTyping = useSendTyping(userId);
  const friendActions = useFriendActions(navigation, (friend) =>
    toast.show(`Challenge sent to ${friend.displayName}`),
  );
  const friend = social.friends?.find((candidate) => candidate.id === userId);
  const presence = presenceOf(friend);
  const canSend = draft.trim().length > 0;

  const openProfile = useCallback(
    () => navigation.navigate('UserProfile', { username }),
    [navigation, username],
  );

  const confirmClear = useCallback(() => {
    Alert.alert(
      'Delete this conversation?',
      'It will be removed for you only.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            conversation
              .clear()
              .catch((error: Error) => toast.show(error.message)),
        },
      ],
    );
  }, [conversation, toast]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Pressable
          style={styles.title}
          onPress={openProfile}
          accessibilityRole="button"
          accessibilityLabel={`${displayName}'s profile`}
          testID="conversation-title"
        >
          <PresenceAvatar
            name={displayName}
            color={avatarColor}
            presence={presence}
            size={32}
          />
          <View style={styles.titleText}>
            <Text style={styles.titleName} numberOfLines={1}>
              {displayName}
            </Text>
            {friend && (
              <Text
                style={styles.titlePresence}
                numberOfLines={1}
                testID="conversation-presence"
              >
                {typing.has(userId) ? 'typing…' : presenceLabel(friend)}
              </Text>
            )}
          </View>
        </Pressable>
      ),
      unstable_headerRightItems: () => [
        plainHeaderItem(
          <Pressable
            onPress={() => setIsMenuOpen(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="More"
            testID="conversation-menu-button"
          >
            <Icon name="dots-horizontal" size={24} />
          </Pressable>,
        ),
      ],
    });
  }, [
    navigation,
    styles,
    openProfile,
    displayName,
    avatarColor,
    presence,
    friend,
    typing,
    userId,
  ]);

  async function deliver(text: string, attachment?: MessageAttachment) {
    const { failure } = await conversation.send(text, attachment);
    if (failure) toast.show(failure);
  }

  function send() {
    if (!canSend) return;
    const text = draft;
    setDraft('');
    void deliver(text);
  }

  async function retry(messageId: string) {
    const { failure } = await conversation.retry(messageId);
    if (failure) toast.show(failure);
  }

  const menuActions: ActionSheetAction[] = [
    {
      label: 'View profile',
      onPress: openProfile,
      testID: 'conversation-action-profile',
    },
    ...(friend
      ? [
          {
            label: 'Challenge',
            onPress: () => friendActions.startChallenge(partner),
            testID: 'conversation-action-challenge',
          },
        ]
      : []),
    ...(friend?.playingGameId
      ? [
          {
            label: 'Watch game',
            onPress: () =>
              friendActions.watch(partner, friend.playingGameId as string),
            testID: 'conversation-action-watch',
          },
        ]
      : []),
    {
      label: 'Delete conversation',
      destructive: true,
      onPress: confirmClear,
      testID: 'clear-conversation-button',
    },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior="padding"
      keyboardVerticalOffset={insets.top + 44}
      testID="conversation-screen"
    >
      {friend?.playingGameId && (
        <View style={styles.playing} testID="conversation-playing">
          <Icon name="chess-knight" size={18} color={colors.accentText} />
          <Text style={styles.playingText} numberOfLines={1}>
            {displayName} is playing right now
          </Text>
          <Button
            label="Watch"
            variant="text"
            onPress={() =>
              friendActions.watch(partner, friend.playingGameId as string)
            }
            testID="conversation-watch"
          />
        </View>
      )}
      {conversation.status === 'error' ? (
        <Text style={styles.error}>{"Messages couldn't be loaded."}</Text>
      ) : (
        <MessageList
          messages={conversation.messages}
          otherName={displayName}
          myUserId={session.isReady ? session.user.id : ''}
          hasOlder={conversation.hasOlder}
          onLoadOlder={conversation.loadOlder}
          theirLastReadAt={conversation.theirLastReadAt}
          isTyping={typing.has(userId)}
          onRetry={retry}
          onOpenGame={(gameId) => navigation.navigate('GameViewer', { gameId })}
          onOpenPosition={(fen) =>
            navigation.navigate('AnalysisBoard', {
              source: { kind: 'setup', fen },
            })
          }
        />
      )}
      <Animated.View
        style={[
          styles.composer,
          {
            // Clear of the home indicator and the screen's rounded corner,
            // except while the keyboard covers them.
            paddingBottom: keyboardHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [insets.bottom + 8, 8],
              extrapolate: 'clamp',
            }),
          },
        ]}
      >
        <Pressable
          onPress={() => setIsPickingGame(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Share a game"
          testID="attach-button"
        >
          <Icon name="plus-circle-outline" size={26} color={colors.accent} />
        </Pressable>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={(text) => {
            setDraft(text);
            sendTyping(text);
          }}
          onSubmitEditing={send}
          placeholder="Message"
          placeholderTextColor={colors.textFaint}
          maxLength={MAX_DIRECT_MESSAGE_LENGTH}
          returnKeyType="send"
          submitBehavior="submit"
          testID="message-input"
        />
        <Pressable
          onPress={send}
          disabled={!canSend}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Send"
          accessibilityState={{ disabled: !canSend }}
          testID="send-message-button"
        >
          <Icon
            name="send"
            size={24}
            color={canSend ? colors.accent : colors.disabled}
          />
        </Pressable>
      </Animated.View>
      <ActionSheet
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        actions={menuActions}
      />
      <GamePickerSheet
        visible={isPickingGame}
        onClose={() => setIsPickingGame(false)}
        onPick={(game) => {
          setIsPickingGame(false);
          void deliver('', { kind: 'game', gameId: game.id });
        }}
      />
      <ChallengeSheet
        opponentName={friendActions.challengeTarget?.displayName ?? null}
        canPlayRated={friendActions.canPlayRated}
        onClose={friendActions.closeChallenge}
        onSend={friendActions.sendChallenge}
      />
      <Toast toasts={toast.toasts} />
    </KeyboardAvoidingView>
  );
};

export default Conversation;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    maxWidth: 240,
  },
  titleText: {
    flexShrink: 1,
  },
  titleName: {
    color: t.colors.text,
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.semibold,
  },
  titlePresence: {
    color: t.colors.textMuted,
    fontSize: t.fontSize.xs,
  },
  playing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingLeft: t.spacing.lg,
    paddingRight: t.spacing.sm,
    backgroundColor: t.colors.accentSubtle,
  },
  playingText: {
    flex: 1,
    color: t.colors.accentText,
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.medium,
  },
  error: {
    flex: 1,
    marginTop: t.spacing.xl,
    textAlign: 'center',
    color: t.colors.textMuted,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: t.colors.border,
  },
  input: {
    color: t.colors.text,
    flex: 1,
    paddingVertical: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    borderRadius: t.radius.xl,
    backgroundColor: t.colors.surface,
    fontSize: t.fontSize.lg,
  },
}));
