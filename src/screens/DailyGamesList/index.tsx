import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ListControls from '../../components/ListControls';
import Toast from '../../components/Toast';
import DailyGameCard from '../../components/YourGamesList/DailyGameCard';
import WaitingSeekCard from '../../components/YourGamesList/WaitingSeekCard';
import { DAILY_GAMES_STATUS, useDailyGames } from '../../hooks/useDailyGames';
import { useMyDailySeeks } from '../../hooks/useMyDailySeeks';
import { useNow } from '../../hooks/useNow';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useToast } from '../../hooks/useToast';
import { DailyGame, DailySeek } from '../../network/restClient';
import {
  DAILY_GAME_SORTS,
  DailyGameSort,
  sortDailyGames,
} from '../../utils/dailyGameSort';
import { HomeStackScreenProps } from '../HomeStack/types';
import { makeStyles, spacing } from '../../theme';

// Time left is shown in minutes at most, so a minute's tick will do.
const TIME_LEFT_REFRESH_MS = 60_000;
const COLUMNS = 2;
const GUTTER = spacing.lg;
const GAP = spacing.md;

type DailyGamesListProps = Pick<
  HomeStackScreenProps<'DailyGamesList'>,
  'navigation'
>;

// Every daily game of yours in progress - Home shows the first ten - two to
// a row across the screen, a pawn on those on your move: your move first, or
// by time left, the last move or the opponent, and only those on your move
// if you like; then the seeks still waiting for an opponent. Sorted and
// filtered here, from the games fetched - and laid out as one wrapping row
// of cards, each keyed by its game, so a new order moves the cards rather
// than drawing their boards again (a list's rows of two would each be new).
const DailyGamesList: React.FC<DailyGamesListProps> = ({ navigation }) => {
  const themed = useStyles();
  const { dailyGames, reload } = useDailyGames();
  const dailySeeks = useMyDailySeeks();
  const reloadSeeks = dailySeeks.reload;
  const toast = useToast();
  const now = useNow(TIME_LEFT_REFRESH_MS);
  const [sort, setSort] = useState<DailyGameSort>('yourMove');
  const [yourMoveOnly, setYourMoveOnly] = useState(false);
  const refresh = usePullToRefresh(reload, reloadSeeks);
  const { width } = useWindowDimensions();
  const cardWidth = (width - 2 * GUTTER - (COLUMNS - 1) * GAP) / COLUMNS;
  const allGames =
    dailyGames.status === DAILY_GAMES_STATUS.READY ? dailyGames.games : null;
  const games = useMemo(
    () => allGames && sortDailyGames(allGames, sort, yourMoveOnly),
    [allGames, sort, yourMoveOnly],
  );
  const openGame = useCallback(
    (game: DailyGame) => navigation.navigate('DailyGame', { gameId: game.id }),
    [navigation],
  );
  const { cancel } = dailySeeks;
  const { show } = toast;
  const cancelSeek = useCallback(
    (seek: DailySeek) =>
      cancel(seek.id).catch((error: Error) => show(error.message)),
    [cancel, show],
  );

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
  if (!games) {
    return (
      <View style={[themed.screen, styles.centred]} testID="daily-games-error">
        <Text style={themed.message}>{"Couldn't load your games."}</Text>
        <Button label="Try again" onPress={reload} variant="text" />
      </View>
    );
  }

  const yourMoveCount = allGames.filter((game) => game.myTurn).length;
  // Waiting for an opponent, none is on your move.
  const seeks = yourMoveOnly ? [] : (dailySeeks.seeks ?? []);
  return (
    <View style={themed.screen} testID="daily-games-list">
      <ListControls<DailyGameSort>
        filter={{
          label: `Your move ${yourMoveCount}`,
          selected: yourMoveOnly,
          onChange: setYourMoveOnly,
          testID: 'daily-games-your-move-filter',
        }}
        sorts={DAILY_GAME_SORTS}
        sort={sort}
        onSortChange={setSort}
        testID="daily-games"
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl {...refresh} />}
        testID="daily-games-scroll"
      >
        {games.length === 0 && seeks.length === 0 ? (
          yourMoveOnly ? (
            <EmptyState
              illustration="games"
              title="Nothing on your move"
              message="Every game is waiting on your opponents."
              testID="daily-games-none-your-move"
            />
          ) : (
            <EmptyState
              illustration="games"
              title="No daily games"
              message="Your daily games in progress will show up here."
              testID="daily-games-empty"
            />
          )
        ) : (
          <View style={styles.grid}>
            {games.map((game) => (
              <DailyGameCard
                key={game.id}
                game={game}
                now={now}
                width={cardWidth}
                marksYourMove
                onPress={openGame}
              />
            ))}
            {seeks.map((seek) => (
              <WaitingSeekCard
                key={`seek-${seek.id}`}
                seek={seek}
                width={cardWidth}
                onCancel={cancelSeek}
              />
            ))}
          </View>
        )}
      </ScrollView>
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
    flexGrow: 1,
    paddingHorizontal: GUTTER,
    paddingBottom: spacing.lg,
  },
  // Two cards fill a row; a row of one lines up under the left of them.
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
});
