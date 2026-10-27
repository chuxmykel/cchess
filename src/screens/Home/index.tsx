import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import HomeHeader from '../../components/HomeHeader';
import FriendsCarousel from '../../components/FriendsCarousel';
import RecentGamesList from '../../components/RecentGamesList';
import SignInPrompt from '../../components/SignInPrompt';
import Button from '../../components/Button';
import ChallengeCard from '../../components/ChallengeCard';
import ChallengeSheet from '../../components/ChallengeSheet';
import FriendRequestCard from '../../components/FriendRequestCard';
import NotificationsMenu from '../../components/NotificationsMenu';
import Toast from '../../components/Toast';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useSocialContext } from '../../context/SocialContext';
import { useFriendActions } from '../../hooks/useFriendActions';
import { useRecentGames } from '../../hooks/useRecentGames';
import { useToast } from '../../hooks/useToast';
import { HomeTabStackScreenProps } from '../HomeTabStack/types';

const HOME_SCREEN_GAME_LIMIT = 10;

type HomeProps = {
  navigation: Pick<HomeTabStackScreenProps<'Home'>['navigation'], 'navigate'>;
};

const Home: React.FC<HomeProps> = ({ navigation }) => {
  const session = useAuthSession();
  const social = useSocialContext();
  const toast = useToast();
  const user = session.isReady ? session.user : null;
  const isSignedIn = user !== null && !user.isGuest;
  const { recentGames, reload } = useRecentGames(HOME_SCREEN_GAME_LIMIT);
  const friendActions = useFriendActions(navigation, (friend) =>
    toast.show(`Challenge sent to ${friend.displayName}`),
  );
  const { challenges, requests } = social;
  const [areNotificationsOpen, setAreNotificationsOpen] = useState(false);
  const notificationCount =
    challenges.incoming.length + requests.incoming.length;
  const hasNotifications =
    notificationCount > 0 || challenges.outgoing.length > 0;

  const reloadSocial = social.reload;
  useFocusEffect(
    useCallback(() => {
      reload();
      reloadSocial();
      // Accepting a challenge navigates to the game, from here or from the
      // challenger's side; the popup is a modal and would stay over it.
      return () => setAreNotificationsOpen(false);
    }, [reload, reloadSocial]),
  );

  // The popup is a modal, so a toast behind it couldn't be seen.
  function showErrorOf(action: Promise<void>) {
    action.catch((error: Error) => {
      setAreNotificationsOpen(false);
      toast.show(error.message);
    });
  }

  return (
    <View style={styles.screen}>
      <HomeHeader
        avatarName={isSignedIn ? user.displayName : undefined}
        avatarColor={isSignedIn ? user.avatarColor : undefined}
        onAvatarPress={() => navigation.navigate('Profile')}
        accessory={
          isSignedIn && (
            <NotificationsMenu
              count={notificationCount}
              isEmpty={!hasNotifications}
              visible={areNotificationsOpen}
              onOpen={() => setAreNotificationsOpen(true)}
              onClose={() => setAreNotificationsOpen(false)}
            >
              {challenges.incoming.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  direction="incoming"
                  onAccept={() =>
                    showErrorOf(social.acceptChallenge(challenge.id))
                  }
                  onDecline={() =>
                    showErrorOf(social.declineChallenge(challenge.id))
                  }
                />
              ))}
              {challenges.outgoing.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  direction="outgoing"
                  onCancel={() =>
                    showErrorOf(social.cancelChallenge(challenge.id))
                  }
                />
              ))}
              {requests.incoming.map((request) => (
                <FriendRequestCard
                  key={request.id}
                  request={request}
                  direction="incoming"
                  onAccept={() =>
                    showErrorOf(social.respondToFriendRequest(request.id, true))
                  }
                  onDecline={() =>
                    showErrorOf(
                      social.respondToFriendRequest(request.id, false),
                    )
                  }
                />
              ))}
            </NotificationsMenu>
          )
        }
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isSignedIn && (
          <FriendsCarousel
            friends={social.friends}
            unreadByUserId={social.unreadByUserId}
            onSeeAll={() => navigation.navigate('Friends')}
            onPress={friendActions.openProfile}
            onMessage={friendActions.message}
            onChallenge={friendActions.startChallenge}
            onWatch={friendActions.watch}
          />
        )}
        {user?.isGuest && (
          <View style={styles.signInPrompt}>
            <SignInPrompt
              onSignIn={() => navigation.navigate('SignIn')}
              onCreateAccount={() => navigation.navigate('CreateAccount')}
            />
          </View>
        )}
        <RecentGamesList
          recentGames={recentGames}
          onRetry={reload}
          onPressGame={(game) =>
            navigation.navigate('GameViewer', { gameId: game.id })
          }
          onSeeAll={() => navigation.navigate('GamesList', {})}
        />
      </ScrollView>
      <View style={styles.playButtonContainer}>
        <Button
          label="Play"
          onPress={() => navigation.navigate('NewGame')}
          variant="primary"
          testID="play-button"
        />
      </View>
      <ChallengeSheet
        opponentName={friendActions.challengeTarget?.displayName ?? null}
        canPlayRated={friendActions.canPlayRated}
        onClose={friendActions.closeChallenge}
        onSend={friendActions.sendChallenge}
      />
      <Toast toasts={toast.toasts} />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 96,
  },
  signInPrompt: {
    paddingTop: 16,
  },
  playButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    // Matches the tab bar's background so this reads as one
    // continuous section rather than a separate floating bar.
    backgroundColor: 'white',
  },
});
