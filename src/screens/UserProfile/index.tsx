import { Fragment, useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { format, parseISO } from 'date-fns';

import ActionList, { ActionListItem } from '../../components/ActionList';
import ActivityList from '../../components/ActivityList';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import ChallengeSheet from '../../components/ChallengeSheet';
import EmptyState from '../../components/EmptyState';
import Placeholder from '../../components/Placeholder';
import RatingsList from '../../components/RatingsList';
import GameRow from '../../components/RecentGamesList/GameRow';
import SectionHeader from '../../components/SectionHeader';
import Toast from '../../components/Toast';
import { MUTED_COLOR } from '../../constants/colors';
import { useSocialContext } from '../../context/SocialContext';
import { useFriendActions } from '../../hooks/useFriendActions';
import { usePagedGames } from '../../hooks/usePagedGames';
import { useToast } from '../../hooks/useToast';
import { useUserProfile } from '../../hooks/useUserProfile';
import { getUserGames, GamesPage, UserProfile } from '../../network/restClient';
import { presenceLabel } from '../../utils/presence';
import { formatScore, formatTimePlayed } from '../../utils/rating';
import { HomeTabStackScreenProps } from '../HomeTabStack/types';

const RECENT_GAMES_SHOWN = 5;

type UserProfileProps = Pick<
  HomeTabStackScreenProps<'UserProfile'>,
  'navigation' | 'route'
>;

const UserProfileScreen: React.FC<UserProfileProps> = ({
  navigation,
  route,
}) => {
  const { username } = route.params;
  const social = useSocialContext();
  const toast = useToast();
  const { state, reload } = useUserProfile(username);
  const friendActions = useFriendActions(navigation, (friend) =>
    toast.show(`Challenge sent to ${friend.displayName}`),
  );
  const fetchGames = useCallback(
    (page: GamesPage, token: string) => getUserGames(username, page, token),
    [username],
  );
  const recentGames = usePagedGames(fetchGames, RECENT_GAMES_SHOWN);

  function runThenReload(action: Promise<void>) {
    action.then(reload).catch((error: Error) => toast.show(error.message));
  }

  function confirmRemove(profile: UserProfile) {
    Alert.alert(`Remove ${profile.displayName}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => runThenReload(social.removeFriend(profile.username)),
      },
    ]);
  }

  // A friend's presence from the live friends list, which the server keeps
  // current; the profile's own is only as fresh as its last load.
  function presenceOf(profile: UserProfile) {
    return (
      social.friends?.find((friend) => friend.id === profile.id) ?? profile
    );
  }

  function actionsFor(profile: UserProfile): ActionListItem[] {
    const { friendship, score } = profile;
    const { playingGameId } = presenceOf(profile);
    if (friendship.status === 'self') {
      return [];
    }
    const items: ActionListItem[] = [];
    if (score) {
      items.push({
        label: `Your score: ${formatScore(score)}`,
        icon: 'scale-balance',
        testID: 'profile-score',
      });
    }
    items.push(
      {
        label: 'Watch game',
        icon: 'television-play',
        onPress: playingGameId
          ? () => friendActions.watch(playingGameId)
          : undefined,
        disabled: !playingGameId,
        testID: 'profile-watch',
      },
      {
        label: 'Challenge',
        icon: 'sword-cross',
        onPress: () => friendActions.startChallenge(profile),
        testID: 'profile-challenge',
      },
    );
    if (friendship.status === 'friends') {
      items.push(
        {
          label: 'Message',
          icon: 'message-outline',
          onPress: () => friendActions.message(profile),
          testID: 'profile-message',
        },
        {
          label: 'Remove friend',
          icon: 'account-remove-outline',
          onPress: () => confirmRemove(profile),
          destructive: true,
          testID: 'profile-remove-friend',
        },
      );
    } else if (friendship.status === 'outgoing' && friendship.requestId) {
      const { requestId } = friendship;
      items.push({
        label: 'Cancel friend request',
        icon: 'account-cancel-outline',
        onPress: () => runThenReload(social.cancelFriendRequest(requestId)),
        testID: 'profile-cancel-request',
      });
    } else if (friendship.status === 'incoming' && friendship.requestId) {
      const { requestId } = friendship;
      items.push({
        label: 'Accept friend request',
        icon: 'account-check-outline',
        onPress: () =>
          runThenReload(social.respondToFriendRequest(requestId, true)),
        testID: 'profile-accept-request',
      });
    } else {
      items.push({
        label: 'Add friend',
        icon: 'account-plus-outline',
        onPress: () =>
          runThenReload(social.sendFriendRequest(profile.username)),
        testID: 'profile-add-friend',
      });
    }
    return items;
  }

  if (state.status === 'loading') {
    return (
      <View style={styles.loading} testID="profile-loading">
        <Placeholder width={72} height={72} />
        <Placeholder width="60%" height={20} />
        <Placeholder width="90%" height={80} />
      </View>
    );
  }
  if (state.status === 'error') {
    return (
      <View style={styles.error} testID="profile-error">
        <Text>{"This profile couldn't be loaded."}</Text>
        <Button label="Try again" variant="outline" onPress={reload} />
      </View>
    );
  }

  const { profile, activity } = state;
  const isSelf = profile.friendship.status === 'self';
  const actions = actionsFor(profile);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        testID="user-profile-screen"
      >
        <View style={styles.header}>
          <Avatar
            name={profile.displayName}
            color={profile.avatarColor}
            size={64}
          />
          <View style={styles.identity}>
            <Text style={styles.name}>{profile.displayName}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
            <Text style={styles.presence} testID="profile-presence">
              {presenceLabel(presenceOf(profile))}
            </Text>
          </View>
        </View>

        <View style={styles.card} testID="profile-totals">
          <Text style={styles.cardLine}>
            Member since {format(parseISO(profile.createdAt), 'MMMM d, yyyy')}
          </Text>
          <Text style={styles.cardLine}>
            {profile.gamesPlayed} {profile.gamesPlayed === 1 ? 'game' : 'games'}
          </Text>
          <Text style={styles.cardLine}>
            Time spent playing: {formatTimePlayed(profile.timePlayedMs)}
          </Text>
        </View>

        {profile.ratings.length > 0 && (
          <View style={styles.section}>
            <RatingsList ratings={profile.ratings} />
          </View>
        )}

        {actions.length > 0 && (
          <View style={styles.section}>
            <ActionList items={actions} />
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader title="Activity" />
        </View>
        <ActivityList
          activity={activity}
          emptyMessage={
            isSelf
              ? 'Your games from the last 30 days will show up here.'
              : `${profile.displayName}'s games from the last 30 days will show up here.`
          }
        />

        <View style={styles.section}>
          <SectionHeader
            title="Recent Games"
            actionLabel="See All"
            onActionPress={() =>
              navigation.navigate('GamesList', {
                username: profile.username,
                displayName: profile.displayName,
              })
            }
            testID="profile-games-see-all"
          />
        </View>
        <View style={styles.gamesCard}>
          {recentGames.games.length === 0 ? (
            <EmptyState
              illustration="games"
              title="No games yet"
              message={
                isSelf
                  ? 'Your recent games will show up here once you play one.'
                  : `${profile.displayName}'s recent games will show up here once they play one.`
              }
              compact
              testID="profile-games-empty"
            />
          ) : (
            recentGames.games.map((game, index) => (
              <Fragment key={game.id}>
                {index > 0 && <View style={styles.divider} />}
                <GameRow
                  game={game}
                  onPress={() =>
                    navigation.navigate('GameViewer', { gameId: game.id })
                  }
                />
              </Fragment>
            ))
          )}
        </View>
      </ScrollView>
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

export default UserProfileScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    paddingBottom: 32,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    gap: 16,
    paddingTop: 32,
    backgroundColor: 'white',
  },
  error: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  identity: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
  },
  username: {
    fontSize: 14,
    color: MUTED_COLOR,
  },
  presence: {
    marginTop: 2,
    fontSize: 13,
    color: MUTED_COLOR,
  },
  card: {
    marginHorizontal: 16,
    padding: 14,
    gap: 4,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  cardLine: {
    fontSize: 14,
  },
  section: {
    marginTop: 16,
  },
  gamesCard: {
    marginHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c8c8c8',
    marginHorizontal: 16,
  },
});
