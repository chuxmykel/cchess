import { Fragment } from 'react';
import { View, StyleSheet } from 'react-native';

import SectionHeader from '../SectionHeader';
import GameRow from './GameRow';
import { RECENT_GAMES } from '../../constants/recentGames';

const HOME_SCREEN_GAME_LIMIT = 10;

const RecentGamesList: React.FC = () => {
  function handleSeeAll() {
    // TODO: navigate to a full game history list once it exists.
  }

  const games = RECENT_GAMES.slice(0, HOME_SCREEN_GAME_LIMIT);

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Recent Games"
        actionLabel="See All"
        onActionPress={handleSeeAll}
        testID="recent-games-see-all"
      />
      <View style={styles.card}>
        {games.map((game, index) => (
          <Fragment key={game.id}>
            {index > 0 && <View style={styles.divider} />}
            <GameRow game={game} />
          </Fragment>
        ))}
      </View>
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
});
