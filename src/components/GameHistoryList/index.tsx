import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Button from '../Button';
import EmptyState from '../EmptyState';
import GameRow from '../RecentGamesList/GameRow';
import { MUTED_COLOR } from '../../constants/colors';
import { FetchGamesPage, usePagedGames } from '../../hooks/usePagedGames';
import { GameSummary } from '../../network/restClient';

const PAGE_SIZE = 20;

interface GameHistoryListProps {
  fetchPage: FetchGamesPage;
  onSelectGame: (game: GameSummary) => void;
  // What the empty list says will show up there.
  emptyMessage: string;
}

// Finished games, newest first, loading more as the list nears its end.
const GameHistoryList: React.FC<GameHistoryListProps> = ({
  fetchPage,
  onSelectGame,
  emptyMessage,
}) => {
  const games = usePagedGames(fetchPage, PAGE_SIZE);

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
        <GameRow game={item} onPress={() => onSelectGame(item)} />
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
          message={emptyMessage}
          testID="games-empty"
        />
      }
      testID="games-list"
    />
  );
};

export default GameHistoryList;

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
