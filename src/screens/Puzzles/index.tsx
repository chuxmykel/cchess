import { View } from 'react-native';

import EmptyState from '../../components/EmptyState';
import { makeStyles } from '../../theme';

// Puzzles aren't here yet; the tab says what's coming.
const Puzzles: React.FC = () => {
  const styles = useStyles();
  return (
    <View style={styles.screen} testID="puzzles-screen">
      <EmptyState
        illustration="puzzles"
        title="Puzzles are on their way"
        message="Find the winning move in positions from real games, and sharpen your tactics a few minutes a day."
        testID="puzzles-coming-soon"
      />
    </View>
  );
};

export default Puzzles;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: t.colors.background,
  },
}));
