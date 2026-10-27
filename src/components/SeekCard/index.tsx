import { View, Text, StyleSheet } from 'react-native';

import { TimeControl } from '../../constants/timeControls';
import GameTypeIcon from '../GameTypeIcon';

interface SeekCardProps {
  timeControl: TimeControl;
  status?: string;
  ratingRange?: string;
}

const SeekCard: React.FC<SeekCardProps> = ({
  timeControl,
  status = 'Waiting for opponent to join…',
  ratingRange,
}) => (
  <View style={styles.card} testID="seek-card">
    <Text style={styles.status}>{status}</Text>
    <View style={styles.timeControl}>
      <GameTypeIcon type={timeControl.type} size={20} />
      <Text style={styles.timeControlLabel}>{timeControl.label}</Text>
    </View>
    {ratingRange && (
      <Text style={styles.detail} testID="seek-card-rating-range">
        {`Rating range ${ratingRange}`}
      </Text>
    )}
  </View>
);

export default SeekCard;

const styles = StyleSheet.create({
  card: {
    minWidth: 200,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  status: {
    fontSize: 14,
    color: '#555',
  },
  timeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  timeControlLabel: {
    fontSize: 22,
    fontWeight: '700',
  },
  detail: {
    fontSize: 14,
    color: '#555',
  },
});
