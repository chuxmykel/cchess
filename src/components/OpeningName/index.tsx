import { StyleSheet, Text } from 'react-native';

import { MUTED_COLOR } from '../../constants/colors';
import { Opening } from '../../domain/openings';

// The opening the moves are in, under the board - or the starting position,
// before it has a name.
const OpeningName: React.FC<{ opening: Opening | null }> = ({ opening }) => (
  <Text style={styles.name} numberOfLines={1} testID="opening-name">
    {opening ? `${opening.eco} · ${opening.name}` : ' '}
  </Text>
);

export default OpeningName;

const styles = StyleSheet.create({
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: MUTED_COLOR,
    textAlign: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
