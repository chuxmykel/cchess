import { useCallback } from 'react';
import { Text, View } from 'react-native';

import BottomSheet from '../BottomSheet';
import GameHistoryList from '../GameHistoryList';
import { GameSummary, getMyGames, GamesPage } from '../../network/restClient';
import { makeStyles } from '../../theme';

interface GamePickerSheetProps {
  visible: boolean;
  onPick: (game: GameSummary) => void;
  onClose: () => void;
}

// One of your games, newest first, to send in a message.
const GamePickerSheet: React.FC<GamePickerSheetProps> = ({
  visible,
  onPick,
  onClose,
}) => {
  const styles = useStyles();
  const fetchPage = useCallback(
    (page: GamesPage, token: string) =>
      getMyGames(token, page.limit, page.before),
    [],
  );
  return (
    <BottomSheet visible={visible} onClose={onClose} heightRatio={0.8}>
      <View style={styles.sheet} testID="game-picker">
        <Text style={styles.title}>Share a game</Text>
        {visible && (
          <View style={styles.list}>
            <GameHistoryList
              fetchPage={fetchPage}
              onSelectGame={onPick}
              emptyMessage="Every game you finish will show up here, to share."
            />
          </View>
        )}
      </View>
    </BottomSheet>
  );
};

export default GamePickerSheet;

const useStyles = makeStyles((t) => ({
  sheet: {
    flex: 1,
    gap: t.spacing.md,
  },
  title: {
    color: t.colors.text,
    fontSize: t.fontSize.xl,
    fontWeight: t.fontWeight.bold,
  },
  list: {
    flex: 1,
    marginHorizontal: -t.spacing.lg,
  },
}));
