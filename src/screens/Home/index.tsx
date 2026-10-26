import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import HomeHeader from '../../components/HomeHeader';
import FriendsCarousel from '../../components/FriendsCarousel';
import RecentGamesList from '../../components/RecentGamesList';
import SignInPrompt from '../../components/SignInPrompt';
import Button from '../../components/Button';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useRecentGames } from '../../hooks/useRecentGames';

const HOME_SCREEN_GAME_LIMIT = 10;

interface HomeProps {
  navigation: {
    navigate: (route: string) => any;
  };
}

const Home: React.FC<HomeProps> = ({ navigation }) => {
  const session = useAuthSession();
  const user = session.isReady ? session.user : null;
  const isSignedIn = user !== null && !user.isGuest;
  const { recentGames, reload } = useRecentGames(HOME_SCREEN_GAME_LIMIT);

  useFocusEffect(reload);

  function play() {
    navigation.navigate('NewGame');
  }

  function goToProfile() {
    navigation.navigate('Profile');
  }

  return (
    <View style={styles.screen}>
      <HomeHeader
        avatarName={isSignedIn ? user.displayName : undefined}
        avatarColor={isSignedIn ? user.avatarColor : undefined}
        onAvatarPress={goToProfile}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isSignedIn && <FriendsCarousel />}
        {user?.isGuest && (
          <View style={styles.signInPrompt}>
            <SignInPrompt
              onSignIn={() => navigation.navigate('SignIn')}
              onCreateAccount={() => navigation.navigate('CreateAccount')}
            />
          </View>
        )}
        <RecentGamesList recentGames={recentGames} onRetry={reload} />
      </ScrollView>
      <View style={styles.playButtonContainer}>
        <Button
          label="Play"
          onPress={play}
          variant="primary"
          testID="play-button"
        />
      </View>
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
