import { useCallback } from 'react';

import GameHistoryList from '../../components/GameHistoryList';
import { getMyGames, GamesPage } from '../../network/restClient';
import { MenuStackScreenProps } from '../MenuStack/types';

type PickGameProps = {
  navigation: Pick<MenuStackScreenProps<'PickGame'>['navigation'], 'navigate'>;
};

// One of your finished games, to analyse from its last move.
const PickGame: React.FC<PickGameProps> = ({ navigation }) => {
  const fetchPage = useCallback(
    (page: GamesPage, token: string) =>
      getMyGames(token, page.limit, page.before),
    [],
  );
  return (
    <GameHistoryList
      fetchPage={fetchPage}
      onSelectGame={(game) =>
        navigation.navigate('AnalysisBoard', {
          source: { kind: 'game', gameId: game.id },
        })
      }
      emptyMessage="Every game you finish will show up here, to analyse."
    />
  );
};

export default PickGame;
