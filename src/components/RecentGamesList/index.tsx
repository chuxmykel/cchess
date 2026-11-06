import { Fragment } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import Button from '../Button';
import Placeholder from '../Placeholder';
import SectionHeader from '../SectionHeader';
import EmptyState from '../EmptyState';
import GameRow, { AVATAR_SIZE, ROW_ICON_SIZE } from './GameRow';
import { RECENT_GAMES_STATUS, RecentGames } from '../../hooks/useRecentGames';
import { GameSummary } from '../../network/restClient';
import { makeStyles } from '../../theme';

interface RecentGamesListProps {
  recentGames: RecentGames;
  onRetry: () => void;
  onPressGame: (game: GameSummary) => void;
  onSeeAll: () => void;
}

const LOADING_ROW_COUNT = 3;

// Rows shaped as GameRow's are: the game type, the opponent's avatar, their
// name over when it was, then the rating change and the result.
const LoadingRows: React.FC = () => {
  const styles = useStyles();
  return (
    <View testID="recent-games-loading">
      {Array.from({ length: LOADING_ROW_COUNT }, (_, index) => (
        <Fragment key={index}>
          {index > 0 && <View style={styles.divider} />}
          <View style={styles.loadingRow}>
            <Placeholder
              width={ROW_ICON_SIZE}
              height={ROW_ICON_SIZE}
              borderRadius={ROW_ICON_SIZE / 2}
            />
            <Placeholder
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              borderRadius={AVATAR_SIZE / 2}
            />
            <View style={styles.loadingDetails}>
              <Placeholder width="60%" height={14} />
              <Placeholder width="35%" height={10} />
            </View>
            <Placeholder width={32} height={14} />
            <Placeholder
              width={ROW_ICON_SIZE}
              height={ROW_ICON_SIZE}
              borderRadius={ROW_ICON_SIZE / 2}
            />
          </View>
        </Fragment>
      ))}
    </View>
  );
};

const RecentGamesList: React.FC<RecentGamesListProps> = ({
  recentGames,
  onRetry,
  onPressGame,
  onSeeAll,
}) => {
  const styles = useStyles();

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
            <EmptyState
              illustration="games"
              title="No games yet"
              message="Your recent games will show up here once you play one."
              compact
              testID="recent-games-empty"
            />
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

const useStyles = makeStyles((t) => ({
  container: {
    paddingTop: t.spacing.xl,
  },
  card: {
    marginHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.xs,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surface,
    ...t.elevation.sm,
    shadowColor: t.colors.shadow,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.separator,
    marginHorizontal: t.spacing.lg,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
  },
  loadingDetails: {
    flex: 1,
    gap: t.spacing.xs,
  },
  message: {
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingVertical: t.spacing.xl,
  },
  messageText: {
    fontSize: t.fontSize.base,
    color: t.colors.textMuted,
  },
}));
