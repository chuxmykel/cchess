import { FlatList, StyleSheet, View } from 'react-native';

import Placeholder from '../Placeholder';
import SectionHeader from '../SectionHeader';
import { DailyGame, DailySeek } from '../../network/restClient';
import { DAILY_GAMES_STATUS, DailyGames } from '../../hooks/useDailyGames';
import { useNow } from '../../hooks/useNow';
import { spacing } from '../../theme';
import DailyGameCard, {
  DAILY_GAME_AVATAR_SIZE,
  DAILY_GAME_BOARD_WIDTH,
  useDailyGameCardStyles,
} from './DailyGameCard';
import WaitingSeekCard from './WaitingSeekCard';

// Time left is shown in minutes at most, so a minute's tick will do.
const TIME_LEFT_REFRESH_MS = 60_000;

type Item =
  { kind: 'game'; game: DailyGame } | { kind: 'seek'; seek: DailySeek };

interface DailyGamesListProps {
  dailyGames: DailyGames;
  /** Daily seeks still waiting; null while they're loading. */
  seeks: DailySeek[] | null;
  onPressGame: (game: DailyGame) => void;
  onCancelSeek: (seek: DailySeek) => void;
  /** Every daily game, on a screen of their own. */
  onSeeAll: () => void;
}

const LOADING_CARD_COUNT = 2;

// Where Daily games will be, while it's loading: a title and cards shaped as
// a game's are - the board, and the opponent under it with the time left -
// gone if there turn out to be none.
const LoadingCards: React.FC = () => {
  const cardStyles = useDailyGameCardStyles();
  return (
    <View style={styles.container} testID="daily-games-section-loading">
      <View style={styles.loadingTitle}>
        <Placeholder width={120} height={20} />
      </View>
      <View style={[styles.list, styles.loadingCards]}>
        {Array.from({ length: LOADING_CARD_COUNT }, (_, index) => (
          <View key={index} style={cardStyles.card}>
            <Placeholder
              width={DAILY_GAME_BOARD_WIDTH}
              height={DAILY_GAME_BOARD_WIDTH}
            />
            <View style={cardStyles.player}>
              <Placeholder
                width={DAILY_GAME_AVATAR_SIZE}
                height={DAILY_GAME_AVATAR_SIZE}
              />
              <View style={styles.loadingText}>
                <Placeholder width="80%" height={12} />
                <Placeholder width="50%" height={10} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

// Home's "Daily games": your daily games in progress, in the server's order -
// those on your move first, then by time left - and after them any seeks
// still waiting for an opponent. Shown only when there's one or the other,
// and as a skeleton while they load.
const DailyGamesList: React.FC<DailyGamesListProps> = ({
  dailyGames,
  seeks,
  onPressGame,
  onCancelSeek,
  onSeeAll,
}) => {
  const now = useNow(TIME_LEFT_REFRESH_MS);
  if (dailyGames.status === DAILY_GAMES_STATUS.LOADING) {
    return <LoadingCards />;
  }
  if (dailyGames.status !== DAILY_GAMES_STATUS.READY) {
    return null;
  }
  const items: Item[] = [
    ...dailyGames.games.map((game) => ({ kind: 'game' as const, game })),
    ...(seeks ?? []).map((seek) => ({ kind: 'seek' as const, seek })),
  ];
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} testID="daily-games-section">
      <SectionHeader
        title="Daily games"
        count={
          dailyGames.games.length > 0 ? dailyGames.games.length : undefined
        }
        actionLabel="See All"
        onActionPress={onSeeAll}
        testID="daily-games-section-see-all"
      />
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) =>
          item.kind === 'game' ? item.game.id : `seek-${item.seek.id}`
        }
        renderItem={({ item }) =>
          item.kind === 'game' ? (
            <DailyGameCard game={item.game} now={now} onPress={onPressGame} />
          ) : (
            <WaitingSeekCard seek={item.seek} onCancel={onCancelSeek} />
          )
        }
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

export default DailyGamesList;

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.xl,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  separator: {
    width: spacing.md,
  },
  loadingTitle: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  loadingCards: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  loadingText: {
    flex: 1,
    gap: spacing.xs,
  },
});
