import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import Toast from '../../components/Toast';
import DailyGameCard from '../../components/YourGamesList/DailyGameCard';
import WaitingSeekCard from '../../components/YourGamesList/WaitingSeekCard';
import { DAILY_GAMES_STATUS, useDailyGames } from '../../hooks/useDailyGames';
import { useMyDailySeeks } from '../../hooks/useMyDailySeeks';
import { useNow } from '../../hooks/useNow';
import { useToast } from '../../hooks/useToast';
import { DailyGame, DailySeek } from '../../network/restClient';
import { HomeStackScreenProps } from '../HomeStack/types';
import { makeStyles, spacing } from '../../theme';

// Time left is shown in minutes at most, so a minute's tick will do.
const TIME_LEFT_REFRESH_MS = 60_000;
const COLUMNS = 2;

type Item =
  { kind: 'game'; game: DailyGame } | { kind: 'seek'; seek: DailySeek };

type DailyGamesListProps = Pick<
  HomeStackScreenProps<'DailyGamesList'>,
  'navigation'
>;

// Every daily game of yours in progress - Home shows the first ten - in the
// server's order, your move first, two to a row; then the seeks still
// waiting for an opponent.
const DailyGamesList: React.FC<DailyGamesListProps> = ({ navigation }) => {
  const themed = useStyles();
  const { dailyGames, reload } = useDailyGames();
  const dailySeeks = useMyDailySeeks();
  const reloadSeeks = dailySeeks.reload;
  const toast = useToast();
  const now = useNow(TIME_LEFT_REFRESH_MS);

  useFocusEffect(
    useCallback(() => {
      reload();
      reloadSeeks();
    }, [reload, reloadSeeks]),
  );

  if (dailyGames.status === DAILY_GAMES_STATUS.LOADING) {
    return (
      <View
        style={[themed.screen, styles.centred]}
        testID="daily-games-loading"
      >
        <ActivityIndicator />
      </View>
    );
  }
  if (dailyGames.status === DAILY_GAMES_STATUS.ERROR) {
    return (
      <View style={[themed.screen, styles.centred]} testID="daily-games-error">
        <Text style={themed.message}>{"Couldn't load your games."}</Text>
        <Button label="Try again" onPress={reload} variant="text" />
      </View>
    );
  }

  const items: Item[] = [
    ...dailyGames.games.map((game) => ({ kind: 'game' as const, game })),
    ...(dailySeeks.seeks ?? []).map((seek) => ({
      kind: 'seek' as const,
      seek,
    })),
  ];
  return (
    <View style={themed.screen} testID="daily-games-list">
      <FlatList
        data={items}
        numColumns={COLUMNS}
        keyExtractor={(item) =>
          item.kind === 'game' ? item.game.id : `seek-${item.seek.id}`
        }
        renderItem={({ item }) =>
          item.kind === 'game' ? (
            <DailyGameCard
              game={item.game}
              now={now}
              onPress={(game) =>
                navigation.navigate('DailyGame', { gameId: game.id })
              }
            />
          ) : (
            <WaitingSeekCard
              seek={item.seek}
              onCancel={(seek) =>
                dailySeeks
                  .cancel(seek.id)
                  .catch((error: Error) => toast.show(error.message))
              }
            />
          )
        }
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <EmptyState
            illustration="games"
            title="No daily games"
            message="Your daily games in progress will show up here."
            testID="daily-games-empty"
          />
        }
      />
      <Toast toasts={toast.toasts} />
    </View>
  );
};

export default DailyGamesList;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  message: {
    color: t.colors.text,
    fontSize: t.fontSize.lg,
  },
}));

const styles = StyleSheet.create({
  centred: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    gap: spacing.md,
    justifyContent: 'center',
  },
});
