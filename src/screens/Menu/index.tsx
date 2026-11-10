import { Pressable, ScrollView, Text, View } from 'react-native';
import { DEFAULT_POSITION } from 'chess.js';

import ActionList from '../../components/ActionList';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import SectionHeader from '../../components/SectionHeader';
import SignInPrompt from '../../components/SignInPrompt';
import { SIGN_OUT_FAILED_MESSAGE } from '../../constants/errorMessages';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { MenuStackScreenProps } from '../MenuStack/types';
import { makeStyles, useTheme } from '../../theme';

type MenuProps = {
  navigation: Pick<MenuStackScreenProps<'Menu'>['navigation'], 'navigate'>;
};

// The More tab - headed "Menu" - for everything that isn't a tab of its
// own: your profile, where an analysis starts (an empty board, the opening
// explorer, a position set up by hand, one of your games, or a game or
// position pasted in), finding players to add, and the settings.
const Menu: React.FC<MenuProps> = ({ navigation }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const session = useAuthSession();
  const signOutAttempt = useAsyncAction(
    session.signOut,
    SIGN_OUT_FAILED_MESSAGE,
  );
  const user = session.isReady ? session.user : null;
  const isSignedIn = user !== null && !user.isGuest;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      testID="menu-screen"
    >
      {user &&
        (isSignedIn ? (
          <Pressable
            style={({ pressed }) => [
              styles.profileCard,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              navigation.navigate('UserProfile', { username: user.username })
            }
            accessibilityRole="button"
            accessibilityLabel="Your profile"
            testID="menu-profile"
          >
            <Avatar
              size={52}
              name={user.displayName}
              color={user.avatarColor}
            />
            <View style={styles.profileText}>
              <Text style={styles.displayName} numberOfLines={1}>
                {user.displayName}
              </Text>
              <Text style={styles.username} numberOfLines={1}>
                @{user.username} · View profile
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.textMuted} />
          </Pressable>
        ) : (
          <SignInPrompt
            onSignIn={() => navigation.navigate('SignIn')}
            onCreateAccount={() => navigation.navigate('CreateAccount')}
          />
        ))}

      <View style={styles.section}>
        <SectionHeader title="Analysis" />
        <ActionList
          items={[
            {
              label: 'New analysis',
              icon: 'checkerboard',
              onPress: () =>
                navigation.navigate('AnalysisBoard', {
                  source: { kind: 'new' },
                }),
              testID: 'analysis-new',
            },
            {
              label: 'Opening explorer',
              icon: 'book-open-variant',
              onPress: () =>
                navigation.navigate('OpeningExplorer', {
                  startFen: DEFAULT_POSITION,
                  uciMoves: [],
                  orientation: 'w',
                }),
              testID: 'menu-opening-explorer',
            },
            {
              label: 'Set up position',
              icon: 'chess-pawn',
              onPress: () =>
                navigation.navigate('AnalysisBoard', {
                  source: { kind: 'setup' },
                }),
              testID: 'analysis-set-up',
            },
            {
              label: 'From your games',
              icon: 'history',
              onPress: () => navigation.navigate('PickGame'),
              testID: 'analysis-pick-game',
            },
            {
              label: 'Paste PGN or FEN',
              icon: 'clipboard-text-outline',
              onPress: () => navigation.navigate('PasteGame'),
              testID: 'analysis-paste',
            },
          ]}
        />
      </View>

      <ActionList
        items={[
          // Finding players to add needs an account - a guest can't.
          ...(isSignedIn
            ? [
                {
                  label: 'Players',
                  icon: 'account-search-outline' as const,
                  onPress: () =>
                    navigation.navigate('FindFriends', { focusSearch: true }),
                  testID: 'menu-players',
                },
              ]
            : []),
          {
            label: 'Settings',
            icon: 'cog-outline',
            onPress: () => navigation.navigate('Settings'),
            testID: 'menu-settings',
          },
        ]}
      />

      {isSignedIn && (
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
      )}
    </ScrollView>
  );
};

export default Menu;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  content: {
    paddingVertical: t.spacing.lg,
    gap: t.spacing.xl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    marginHorizontal: t.spacing.lg,
    padding: t.spacing.lg,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  profileText: {
    flex: 1,
    gap: t.spacing.xxs,
  },
  displayName: {
    color: t.colors.text,
    fontSize: t.fontSize.lg,
    fontWeight: t.fontWeight.semibold,
  },
  username: {
    color: t.colors.textMuted,
    fontSize: t.fontSize.sm,
  },
  section: {
    gap: t.spacing.sm,
  },
  signOut: {
    paddingHorizontal: t.spacing.lg,
    gap: t.spacing.sm,
  },
  error: {
    color: t.colors.danger,
    textAlign: 'center',
  },
}));
