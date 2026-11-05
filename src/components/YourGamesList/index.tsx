import { FlatList, StyleSheet, View } from 'react-native';

import SectionHeader from '../SectionHeader';
import { DailyGame, DailySeek } from '../../network/restClient';
import { DAILY_GAMES_STATUS, DailyGames } from '../../hooks/useDailyGames';
import { useNow } from '../../hooks/useNow';
import { spacing } from '../../theme';
import DailyGameCard from './DailyGameCard';
import WaitingSeekCard from './WaitingSeekCard';

// Time left is shown in minutes at most, so a minute's tick will do.
const TIME_LEFT_REFRESH_MS = 60_000;

type Item =
  { kind: 'game'; game: DailyGame } | { kind: 'seek'; seek: DailySeek };

interface YourGamesListProps {
  dailyGames: DailyGames;
  /** Daily seeks still waiting; null while they're loading. */
  seeks: DailySeek[] | null;
  onPressGame: (game: DailyGame) => void;
  onCancelSeek: (seek: DailySeek) => void;
}

// Home's "Your games": your daily games in progress, in the server's order -
// those on your move first, then by time left - and after them any seeks
// still waiting for an opponent. Shown only when there's one or the other.
const YourGamesList: React.FC<YourGamesListProps> = ({
  dailyGames,
  seeks,
  onPressGame,
  onCancelSeek,
}) => {
  const now = useNow(TIME_LEFT_REFRESH_MS);
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
    <View style={styles.container} testID="your-games">
      <SectionHeader
        title="Your games"
        count={
          dailyGames.games.length > 0 ? dailyGames.games.length : undefined
        }
        testID="your-games-header"
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

export default YourGamesList;

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
});
