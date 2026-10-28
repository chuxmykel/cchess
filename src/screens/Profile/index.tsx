import { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import RatingsList from '../../components/RatingsList';
import SignInPrompt from '../../components/SignInPrompt';
import { SIGN_OUT_FAILED_MESSAGE } from '../../constants/errorMessages';
import { useAuthSession } from '../../context/AuthSessionContext';
import { AUTH_SESSION_STATUS } from '../../hooks/useAuthSessionLifecycle';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { HomeStackParamList } from '../HomeStack/types';

interface ProfileProps {
  navigation: {
    navigate: {
      (route: 'SignIn' | 'CreateAccount'): void;
      (route: 'RatingStats', params: HomeStackParamList['RatingStats']): void;
    };
  };
}

const Profile: React.FC<ProfileProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const session = useAuthSession();
  const { reloadUser, signOut } = session;
  const isSignedIn = session.isReady && !session.user.isGuest;
  const signOutAttempt = useAsyncAction(signOut, SIGN_OUT_FAILED_MESSAGE);

  useFocusEffect(
    useCallback(() => {
      if (isSignedIn) {
        reloadUser().catch(() => {});
      }
    }, [isSignedIn, reloadUser]),
  );

  if (!session.isReady) {
    return (
      <View style={styles.centered} testID="profile-screen">
        {session.status === AUTH_SESSION_STATUS.ERROR ? (
          <Text style={styles.muted}>{"Couldn't reach the server."}</Text>
        ) : (
          <ActivityIndicator />
        )}
      </View>
    );
  }

  const { user } = session;

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
      testID="profile-screen"
    >
      <View style={styles.identity}>
        {user.isGuest ? (
          <Avatar size={72} />
        ) : (
          <Avatar size={72} name={user.displayName} color={user.avatarColor} />
        )}
        <Text style={styles.displayName}>{user.displayName}</Text>
        {!user.isGuest && <Text style={styles.muted}>@{user.username}</Text>}
      </View>

      {user.isGuest ? (
        <SignInPrompt
          onSignIn={() => navigation.navigate('SignIn')}
          onCreateAccount={() => navigation.navigate('CreateAccount')}
        />
      ) : (
        <>
          <Text style={styles.sectionTitle}>Ratings</Text>
          <RatingsList
            ratings={user.ratings}
            onSelect={(category) =>
              navigation.navigate('RatingStats', {
                username: user.username,
                displayName: user.displayName,
                category,
              })
            }
          />
          <View style={styles.signOut}>
            {signOutAttempt.errorMessage && (
              <Text style={styles.error}>{signOutAttempt.errorMessage}</Text>
            )}
            <Button
              label={signOutAttempt.isRunning ? 'Signing out…' : 'Sign out'}
              onPress={signOutAttempt.run}
              disabled={signOutAttempt.isRunning}
              variant="outline"
              testID="sign-out-button"
            />
          </View>
        </>
      )}
    </ScrollView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 24,
    gap: 16,
  },
  identity: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  muted: {
    fontSize: 14,
    color: '#888',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
  },
  signOut: {
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  error: {
    color: '#e53935',
    fontSize: 14,
    textAlign: 'center',
  },
});
