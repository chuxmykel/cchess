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
import { FetchGamesPage, usePagedGames } from '../../hooks/usePagedGames';
import { GameSummary } from '../../network/restClient';
import { makeStyles } from '../../theme';

const PAGE_SIZE = 20;

interface GameHistoryListProps {
  fetchPage: FetchGamesPage;
  onSelectGame: (game: GameSummary) => void;
  // What the empty list says will show up there.
  emptyMessage: string;
  // Its title, "No games yet" unless given.
  emptyTitle?: string;
}

// Finished games, newest first, loading more as the list nears its end.
const GameHistoryList: React.FC<GameHistoryListProps> = ({
  fetchPage,
  onSelectGame,
  emptyMessage,
  emptyTitle = 'No games yet',
}) => {
  const styles = useStyles();

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
          title={emptyTitle}
          message={emptyMessage}
          testID="games-empty"
        />
      }
      testID="games-list"
    />
  );
};

export default GameHistoryList;

const useStyles = makeStyles((t) => ({
  list: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  loading: {
    marginTop: t.spacing.xxl,
  },
  message: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.md,
  },
  messageText: {
    color: t.colors.textMuted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.separator,
    marginHorizontal: t.spacing.lg,
  },
  more: {
    marginVertical: t.spacing.lg,
  },
}));
