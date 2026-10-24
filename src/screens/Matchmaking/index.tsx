import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import Button from '../../components/Button';
import GameTypeIcon from '../../components/GameTypeIcon';
import ConnectionStrengthIndicator from '../../components/ConnectionStrengthIndicator';
import Toast from '../../components/Toast';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { GAME_TYPE_LABELS } from '../../constants/timeControls';
import { HomeStackParamList } from '../HomeStack/types';

type MatchmakingProps = NativeStackScreenProps<
  HomeStackParamList,
  'Matchmaking'
>;

const Matchmaking: React.FC<MatchmakingProps> = ({ route, navigation }) => {
  const { timeControl } = route.params;
  const { toasts, isConnecting, cancel } = useMatchmaking(
    navigation,
    timeControl,
  );

  if (isConnecting) {
    return (
      <View style={styles.connecting}>
        <Text style={styles.connectingLabel}>Connecting…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.content} testID="matchmaking-overlay">
        <ConnectionStrengthIndicator />

        <ActivityIndicator
          size="large"
          color="#769656"
          style={styles.spinner}
        />

        <Text style={styles.title}>Waiting for opponent…</Text>

        <View style={styles.timeControlChip}>
          <GameTypeIcon type={timeControl.type} />
          <Text style={styles.timeControlLabel}>
            {GAME_TYPE_LABELS[timeControl.type]} · {timeControl.label}
          </Text>
        </View>

        <Button
          label="Cancel"
          onPress={cancel}
          variant="outline"
          style={styles.cancelButton}
          testID="matchmaking-cancel-button"
        />
      </View>
      <Toast toasts={toasts} />
    </View>
  );
};

export default Matchmaking;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  connecting: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectingLabel: {
    fontSize: 16,
    color: '#888',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  spinner: {
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  timeControlChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
  },
  timeControlLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 24,
    minWidth: 160,
  },
});
