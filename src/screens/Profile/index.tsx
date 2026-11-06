import { useCallback } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ActionList from '../../components/ActionList';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import RatingsList from '../../components/RatingsList';
import SignInPrompt from '../../components/SignInPrompt';
import { SIGN_OUT_FAILED_MESSAGE } from '../../constants/errorMessages';
import { useAuthSession } from '../../context/AuthSessionContext';
import { AUTH_SESSION_STATUS } from '../../hooks/useAuthSessionLifecycle';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useUserFriends } from '../../hooks/useUserFriends';
import { HomeStackParamList } from '../HomeStack/types';
import MyFriends, { MyFriendsNavigation } from './MyFriends';
import { makeStyles } from '../../theme';

interface ProfileProps {
  navigation: {
    navigate: {
      (route: 'SignIn' | 'CreateAccount' | 'Appearance' | 'Licenses'): void;
      (route: 'RatingStats', params: HomeStackParamList['RatingStats']): void;
    } & MyFriendsNavigation['navigate'];
  };
}

const Profile: React.FC<ProfileProps> = ({ navigation }) => {
  const styles = useStyles();

  const insets = useSafeAreaInsets();
  const session = useAuthSession();
  const { reloadUser, signOut } = session;
  const isSignedIn = session.isReady && !session.user.isGuest;
  const signOutAttempt = useAsyncAction(signOut, SIGN_OUT_FAILED_MESSAGE);

  const { state: friends, reload: reloadFriends } = useUserFriends(
    isSignedIn ? session.user.username : null,
  );
  // Your ratings and friends, kept current each time the tab is shown, and
  // when it's pulled down.
  const reload = useCallback(
    () =>
      isSignedIn
        ? Promise.all([reloadUser().catch(() => {}), reloadFriends()])
        : Promise.resolve(),
    [isSignedIn, reloadUser, reloadFriends],
  );
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  const refresh = usePullToRefresh(reload);

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
      refreshControl={
        isSignedIn ? (
          <RefreshControl {...refresh} progressViewOffset={insets.top} />
        ) : undefined
      }
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
          <MyFriends
            username={user.username}
            displayName={user.displayName}
            state={friends}
            navigation={navigation}
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
      <ActionList
        items={[
          {
            label: 'Appearance',
            icon: 'palette-outline',
            onPress: () => navigation.navigate('Appearance'),
            testID: 'appearance-row',
          },
          {
            label: 'Licenses',
            icon: 'scale-balance',
            onPress: () => navigation.navigate('Licenses'),
            testID: 'licenses-row',
          },
        ]}
      />
    </ScrollView>
  );
};

export default Profile;

const useStyles = makeStyles((t) => ({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: t.spacing.xl,
    gap: t.spacing.lg,
  },
  identity: {
    alignItems: 'center',
    gap: t.spacing.xs,
    marginBottom: t.spacing.sm,
  },
  displayName: {
    color: t.colors.text,
    fontSize: t.fontSize.h3,
    fontWeight: t.fontWeight.bold,
    marginTop: t.spacing.sm,
  },
  muted: {
    fontSize: t.fontSize.base,
    color: t.colors.textMuted,
  },
  sectionTitle: {
    color: t.colors.text,
    fontSize: t.fontSize.xxl,
    fontWeight: t.fontWeight.bold,
    paddingHorizontal: t.spacing.lg,
  },
  signOut: {
    paddingHorizontal: t.spacing.lg,
    marginTop: t.spacing.sm,
    gap: t.spacing.sm,
  },
  error: {
    color: t.colors.danger,
    fontSize: t.fontSize.base,
    textAlign: 'center',
  },
}));
