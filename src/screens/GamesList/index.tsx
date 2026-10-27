import { useCallback, useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import GameRow from '../../components/RecentGamesList/GameRow';
import { MUTED_COLOR } from '../../constants/colors';
import { usePagedGames } from '../../hooks/usePagedGames';
import { getMyGames, getUserGames, GamesPage } from '../../network/restClient';
import { HomeTabStackScreenProps } from '../HomeTabStack/types';

const PAGE_SIZE = 20;

type GamesListProps = Pick<
  HomeTabStackScreenProps<'GamesList'>,
  'navigation' | 'route'
>;

const GamesList: React.FC<GamesListProps> = ({ navigation, route }) => {
  const { username, displayName } = route.params;
  const fetchPage = useCallback(
    (page: GamesPage, token: string) =>
      username
        ? getUserGames(username, page, token)
        : getMyGames(token, page.limit, page.before),
    [username],
  );
  const games = usePagedGames(fetchPage, PAGE_SIZE);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: displayName ? `${displayName}'s games` : 'Your games',
    });
  }, [navigation, displayName]);

  if (games.status === 'loading') {
    return <ActivityIndicator style={styles.loading} testID="games-loading" />;
  }
  if (games.status === 'error') {
    return (
      <View style={styles.message} testID="games-error">
        <Text style={styles.messageText}>{"Couldn't load the games."}</Text>
        <Button label="Try again" variant="outline" onPress={games.reload} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={games.games}
      keyExtractor={(game) => game.id}
      renderItem={({ item }) => (
        <GameRow
          game={item}
          onPress={() => navigation.navigate('GameViewer', { gameId: item.id })}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.divider} />}
      onEndReached={games.loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        games.isLoadingMore ? <ActivityIndicator style={styles.more} /> : null
      }
      ListEmptyComponent={
        <EmptyState
          illustration="games"
          title="No games yet"
          message={
            displayName
              ? `${displayName}'s finished games will show up here.`
              : 'Every game you finish will show up here.'
          }
          testID="games-empty"
        />
      }
      testID="games-list"
    />
  );
};

export default GamesList;

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: 'white',
  },
  loading: {
    marginTop: 32,
  },
  message: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  messageText: {
    color: MUTED_COLOR,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c8c8c8',
    marginHorizontal: 16,
  },
  more: {
    marginVertical: 16,
  },
});
