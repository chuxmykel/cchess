import { Text } from 'react-native';

import { Opening } from '../../domain/openings';
import { makeStyles } from '../../theme';

// The opening the moves are in, under the board - or the starting position,
// before it has a name.
const OpeningName: React.FC<{ opening: Opening | null }> = ({ opening }) => {
  const styles = useStyles();
  return (
    <Text style={styles.name} numberOfLines={1} testID="opening-name">
      {opening ? `${opening.eco} · ${opening.name}` : ' '}
    </Text>
  );
};

export default OpeningName;

const useStyles = makeStyles((t) => ({
  name: {
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.medium,
    color: t.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
  },
}));
