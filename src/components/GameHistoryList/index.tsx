import { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Button from '../Button';
import EmptyState from '../EmptyState';
import GameRow from '../RecentGamesList/GameRow';
import { FetchGamesPage, usePagedGames } from '../../hooks/usePagedGames';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { GameSummary } from '../../network/restClient';
import { makeStyles } from '../../theme';

const PAGE_SIZE = 20;

interface GameHistoryListProps {
  fetchPage: FetchGamesPage;
  onSelectGame: (game: GameSummary) => void;
  /** Only the games it's true of, from those fetched. */
  filter?: (game: GameSummary) => boolean;
  // What the empty list says will show up there.
  emptyMessage: string;
  // Its title, "No games yet" unless given.
  emptyTitle?: string;
}

// Finished games, newest first, loading more as the list nears its end -
// or, filtered, while fewer than a page's worth match - and again when
// pulled down.
const GameHistoryList: React.FC<GameHistoryListProps> = ({
  fetchPage,
  onSelectGame,
  filter,
  emptyMessage,
  emptyTitle = 'No games yet',
}) => {
  const styles = useStyles();

  const games = usePagedGames(fetchPage, PAGE_SIZE);
  const refresh = usePullToRefresh(games.reload);
  const shown = useMemo(
    () => (filter ? games.games.filter(filter) : games.games),
    [games.games, filter],
  );

  // Too few match to fill the screen, or reach the list's end to ask for
  // more: fetch on until enough do, or there are no more.
  const { hasMore, isLoadingMore, loadMore, status } = games;
  const needsMore =
    status === 'ready' && hasMore && !isLoadingMore && shown.length < PAGE_SIZE;
  useEffect(() => {
    if (needsMore) loadMore();
  }, [needsMore, loadMore]);

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
      data={shown}
      keyExtractor={(game) => game.id}
      renderItem={({ item }) => (
        <GameRow game={item} onPress={() => onSelectGame(item)} />
      )}
      ItemSeparatorComponent={() => <View style={styles.divider} />}
      onEndReached={games.loadMore}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl {...refresh} />}
      ListFooterComponent={
        games.isLoadingMore ? <ActivityIndicator style={styles.more} /> : null
      }
      ListEmptyComponent={
        games.isLoadingMore ? null : (
          <EmptyState
            illustration="games"
            title={emptyTitle}
            message={emptyMessage}
            testID="games-empty"
          />
        )
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
