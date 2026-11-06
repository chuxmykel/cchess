import { useCallback, useLayoutEffect, useState } from 'react';
import { View } from 'react-native';

import Dropdown from '../../components/Dropdown';
import GameHistoryList from '../../components/GameHistoryList';
import { GAME_TYPE_LABELS } from '../../constants/timeControls';
import { GameType } from '../../domain/types';
import {
  GameHistoryResult,
  GameSummary,
  getMyGames,
  getUserGames,
  GamesPage,
} from '../../network/restClient';
import { HomeStackScreenProps } from '../HomeStack/types';
import { makeStyles } from '../../theme';

type GamesListProps = Pick<
  HomeStackScreenProps<'GamesList'>,
  'navigation' | 'route'
>;

type ResultChoice = 'all' | NonNullable<GameHistoryResult>;
type TypeChoice = 'all' | GameType;

const RESULTS: { key: ResultChoice; label: string }[] = [
  { key: 'all', label: 'All results' },
  { key: 'win', label: 'Wins' },
  { key: 'draw', label: 'Draws' },
  { key: 'loss', label: 'Losses' },
];
const TYPES: { key: TypeChoice; label: string }[] = [
  { key: 'all', label: 'All types' },
  ...(Object.keys(GAME_TYPE_LABELS) as GameType[]).map((type) => ({
    key: type,
    label: GAME_TYPE_LABELS[type],
  })),
];

// A player's finished games - yours, or anyone's - newest first, narrowed
// to those won, drawn or lost (by them) and of one type, if asked: from the
// games fetched, so a new choice shows at once.
const GamesList: React.FC<GamesListProps> = ({ navigation, route }) => {
  const styles = useStyles();
  const { username, displayName } = route.params;
  const [result, setResult] = useState<ResultChoice>('all');
  const [gameType, setGameType] = useState<TypeChoice>('all');
  const isFiltered = result !== 'all' || gameType !== 'all';

  const fetchPage = useCallback(
    (page: GamesPage, token: string) =>
      username
        ? getUserGames(username, page, token)
        : getMyGames(token, page.limit, page.before),
    [username],
  );
  const matches = useCallback(
    (game: GameSummary) =>
      (result === 'all' || game.result === result) &&
      (gameType === 'all' || game.gameType === gameType),
    [result, gameType],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: displayName ? `${displayName}'s games` : 'Game history',
    });
  }, [navigation, displayName]);

  let emptyMessage = displayName
    ? `${displayName}'s finished games will show up here.`
    : 'Every game you finish will show up here.';
  if (isFiltered) emptyMessage = 'No finished games match these filters.';

  return (
    <View style={styles.screen}>
      <View style={styles.filters}>
        <Dropdown<ResultChoice>
          options={RESULTS}
          value={result}
          onChange={setResult}
          icon="filter-variant"
          accessibilityName="Result"
          testID="games-result-filter"
        />
        <Dropdown<TypeChoice>
          options={TYPES}
          value={gameType}
          onChange={setGameType}
          icon="timer-outline"
          accessibilityName="Game type"
          testID="games-type-filter"
        />
      </View>
      <GameHistoryList
        fetchPage={fetchPage}
        filter={isFiltered ? matches : undefined}
        onSelectGame={(game) =>
          navigation.navigate('GameViewer', { gameId: game.id })
        }
        emptyTitle={isFiltered ? 'No games' : undefined}
        emptyMessage={emptyMessage}
      />
    </View>
  );
};

export default GamesList;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xl,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.md,
  },
}));
