import { Fragment } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import Button from '../Button';
import Placeholder from '../Placeholder';
import SectionHeader from '../SectionHeader';
import GameRow from './GameRow';
import { RECENT_GAMES_STATUS, RecentGames } from '../../hooks/useRecentGames';
import { GameSummary } from '../../network/restClient';

interface RecentGamesListProps {
  recentGames: RecentGames;
  onRetry: () => void;
  onPressGame: (game: GameSummary) => void;
  onSeeAll: () => void;
}

const LOADING_ROW_COUNT = 3;

const LoadingRows: React.FC = () => (
  <View testID="recent-games-loading">
    {Array.from({ length: LOADING_ROW_COUNT }, (_, index) => (
      <View key={index} style={styles.loadingRow}>
        <Placeholder width={36} height={36} />
        <Placeholder width="50%" height={16} />
      </View>
    ))}
  </View>
);

const RecentGamesList: React.FC<RecentGamesListProps> = ({
  recentGames,
  onRetry,
  onPressGame,
  onSeeAll,
}) => {
  function renderContent() {
    switch (recentGames.status) {
      case RECENT_GAMES_STATUS.LOADING:
        return <LoadingRows />;
      case RECENT_GAMES_STATUS.ERROR:
        return (
          <View style={styles.message}>
            <Text style={styles.messageText}>
              {"Couldn't load your games."}
            </Text>
            <Button
              label="Try again"
              onPress={onRetry}
              variant="text"
              testID="recent-games-retry"
            />
          </View>
        );
      case RECENT_GAMES_STATUS.READY:
        if (recentGames.games.length === 0) {
          return (
            <View style={styles.message}>
              <Text style={styles.messageText}>Your games will show here.</Text>
            </View>
          );
        }
        return recentGames.games.map((game, index) => (
          <Fragment key={game.id}>
            {index > 0 && <View style={styles.divider} />}
            <GameRow game={game} onPress={onPressGame} />
          </Fragment>
        ));
    }
  }

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Recent Games"
        actionLabel="See All"
        onActionPress={onSeeAll}
        testID="recent-games-see-all"
      />
      <View style={styles.card}>{renderContent()}</View>
    </View>
  );
};

export default RecentGamesList;

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
  },
  card: {
    marginHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c8c8c8',
    marginHorizontal: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  message: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  messageText: {
    fontSize: 14,
    color: '#888',
  },
});
