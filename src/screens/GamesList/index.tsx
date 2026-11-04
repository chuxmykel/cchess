import { useCallback, useLayoutEffect } from 'react';

import GameHistoryList from '../../components/GameHistoryList';
import { getMyGames, getUserGames, GamesPage } from '../../network/restClient';
import { HomeStackScreenProps } from '../HomeStack/types';

type GamesListProps = Pick<
  HomeStackScreenProps<'GamesList'>,
  'navigation' | 'route'
>;

const GamesList: React.FC<GamesListProps> = ({ navigation, route }) => {
  const { username, displayName } = route.params;
  const fetchPage = useCallback(
    (page: GamesPage, token: string) =>
      username
        ? getUserGames(username, page, token)
        : getMyGames(token, page.limit, page.before),
    [username],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: displayName ? `${displayName}'s games` : 'Your games',
    });
  }, [navigation, displayName]);

  return (
    <GameHistoryList
      fetchPage={fetchPage}
      onSelectGame={(game) =>
        navigation.navigate('GameViewer', { gameId: game.id })
      }
      emptyMessage={
        displayName
          ? `${displayName}'s finished games will show up here.`
          : 'Every game you finish will show up here.'
      }
    />
  );
};

export default GamesList;
