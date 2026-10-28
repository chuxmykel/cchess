import { useCallback, useLayoutEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '../../components/Icon';
import MessageList from '../../components/MessageList';
import Toast from '../../components/Toast';
import { MAX_DIRECT_MESSAGE_LENGTH } from '../../constants/chat';
import { ACCENT_COLOR, MUTED_COLOR } from '../../constants/colors';
import { MESSAGE_FAILED_MESSAGE } from '../../constants/errorMessages';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useSocialContext } from '../../context/SocialContext';
import { useDirectMessages } from '../../hooks/useDirectMessages';
import { useToast } from '../../hooks/useToast';
import { ApiError } from '../../network/restClient';
import { presenceLabel } from '../../utils/presence';
import { HomeStackScreenProps } from '../HomeStack/types';

type ConversationProps = Pick<
  HomeStackScreenProps<'Conversation'>,
  'navigation' | 'route'
>;

const Conversation: React.FC<ConversationProps> = ({ navigation, route }) => {
  const { userId, username, displayName } = route.params;
  const session = useAuthSession();
  const social = useSocialContext();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const markRead = useCallback(
    () => social.markConversationRead(userId),
    [social, userId],
  );
  const conversation = useDirectMessages(username, userId, markRead);
  const friend = social.friends?.find((candidate) => candidate.id === userId);
  const canSend = draft.trim().length > 0;

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
      title: displayName,
      headerRight: () => (
        <Pressable
          onPress={confirmClear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Delete conversation"
          testID="clear-conversation-button"
        >
          <Icon name="trash-can-outline" size={22} />
        </Pressable>
      ),
    });
  }, [navigation, displayName, confirmClear]);

  function send() {
    if (!canSend) return;
    const text = draft;
    setDraft('');
    conversation.send(text).catch((error: unknown) => {
      setDraft(text);
      toast.show(
        error instanceof ApiError && error.status !== 0
          ? error.message
          : MESSAGE_FAILED_MESSAGE,
      );
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior="padding"
      keyboardVerticalOffset={insets.top + 44}
      testID="conversation-screen"
    >
      {friend && (
        <Text style={styles.presence} testID="conversation-presence">
          {presenceLabel(friend)}
        </Text>
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
        />
      )}
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={send}
          placeholder="Message"
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
            color={canSend ? ACCENT_COLOR : '#c4c4c4'}
          />
        </Pressable>
      </View>
      <Toast toasts={toast.toasts} />
    </KeyboardAvoidingView>
  );
};

export default Conversation;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'white',
  },
  presence: {
    paddingVertical: 6,
    textAlign: 'center',
    fontSize: 12,
    color: MUTED_COLOR,
  },
  error: {
    flex: 1,
    marginTop: 24,
    textAlign: 'center',
    color: MUTED_COLOR,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
    fontSize: 15,
  },
});
