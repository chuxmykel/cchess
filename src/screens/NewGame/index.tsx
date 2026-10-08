import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '../../components/Button';
import TimeControlSelector from '../../components/TimeControlSelector';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import {
  TimeControl,
  DEFAULT_TIME_CONTROL,
} from '../../constants/timeControls';

interface NewGameProps {
  navigation: {
    navigate: (route: string) => any;
  };
}

const NewGame: React.FC<NewGameProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [timeControl, setTimeControl] =
    useState<TimeControl>(DEFAULT_TIME_CONTROL);
  const toast = useToast();

  function startNewGame() {
    navigation.navigate('Game');
  }

  function challengeFriend() {
    toast.show('Coming soon');
  }

  function playStockfish() {
    toast.show('Coming soon');
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.content, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.title}>New Game</Text>

        <Text style={styles.sectionLabel}>Time Control</Text>
        <TimeControlSelector selected={timeControl} onSelect={setTimeControl} />

        <Button
          label="Start New Game"
          onPress={startNewGame}
          variant="primary"
          style={styles.startButton}
          testID="start-new-game-button"
        />

        <View style={styles.secondaryRow}>
          <Button
            label="Challenge a Friend"
            onDisabledPress={challengeFriend}
            appearsDisabled
            variant="outline"
            icon={'\u{1F91D}'}
            style={styles.secondaryButtonSpacing}
            testID="challenge-friend-button"
          />
          <Button
            label="Play Stockfish"
            onDisabledPress={playStockfish}
            appearsDisabled
            variant="outline"
            icon={'\u{1F916}'}
            testID="play-stockfish-button"
          />
        </View>
      </View>
      <Toast toasts={toast.toasts} />
    </View>
  );
};

export default NewGame;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  startButton: {
    marginTop: 24,
  },
  secondaryRow: {
    marginTop: 12,
  },
  secondaryButtonSpacing: {
    marginBottom: 12,
  },
});
