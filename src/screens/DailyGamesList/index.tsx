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
// The filter hides the others rather than taking them away, so switching it
// off shows boards already drawn.
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
    () => allGames && sortDailyGames(allGames, sort),
    [allGames, sort],
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
  const seeks = dailySeeks.seeks ?? [];
  // Waiting for an opponent, no seek is on your move.
  const shownCount = yourMoveOnly
    ? yourMoveCount
    : allGames.length + seeks.length;
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
        {shownCount === 0 &&
          (yourMoveOnly ? (
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
          ))}
        <View style={styles.grid}>
          {games.map((game) => (
            <Shown key={game.id} shown={!yourMoveOnly || game.myTurn}>
              <DailyGameCard
                game={game}
                now={now}
                width={cardWidth}
                marksYourMove
                onPress={openGame}
              />
            </Shown>
          ))}
          {seeks.map((seek) => (
            <Shown key={`seek-${seek.id}`} shown={!yourMoveOnly}>
              <WaitingSeekCard
                seek={seek}
                width={cardWidth}
                onCancel={cancelSeek}
              />
            </Shown>
          ))}
        </View>
      </ScrollView>
      <Toast toasts={toast.toasts} />
    </View>
  );
};

// A card kept drawn while the filter leaves it out, taking no room.
const Shown: React.FC<{ shown: boolean; children: React.ReactNode }> = ({
  shown,
  children,
}) => <View style={!shown && styles.hidden}>{children}</View>;

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
  hidden: {
    display: 'none',
  },
  // Two cards fill a row; a row of one lines up under the left of them.
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
});
