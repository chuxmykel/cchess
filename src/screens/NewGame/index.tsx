import { useState } from 'react';
import { View, Text } from 'react-native';

import Button from '../../components/Button';
import GameSettings from '../../components/GameSettings';
import TimeControlSelector from '../../components/TimeControlSelector';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { useAuthSession } from '../../context/AuthSessionContext';
import { DEFAULT_RATING_RANGE, Seek } from '../../constants/seek';
import { ColorChoice } from '../../network/socketEvents';
import {
  TimeControl,
  DEFAULT_TIME_CONTROL,
} from '../../constants/timeControls';
import { makeStyles } from '../../theme';

interface NewGameProps {
  navigation: {
    navigate: (route: string, params?: object) => any;
  };
}

const NewGame: React.FC<NewGameProps> = ({ navigation }) => {
  const styles = useStyles();

  const [timeControl, setTimeControl] =
    useState<TimeControl>(DEFAULT_TIME_CONTROL);
  const [chosenRated, setChosenRated] = useState(true);
  const [ratingRange, setRatingRange] = useState(DEFAULT_RATING_RANGE);
  const [color, setColor] = useState<ColorChoice>('random');
  const toast = useToast();
  const authSession = useAuthSession();
  const isGuest = !authSession.isReady || authSession.user.isGuest;
  const rated = !isGuest && chosenRated;

  function startNewGame() {
    const seek: Seek = { timeControl, rated, ratingRange, color };
    navigation.navigate('LiveGame', { seek });
  }

  function challengeFriend() {
    if (isGuest) {
      toast.show('Sign in to challenge friends.');
    } else {
      navigation.navigate('Friends');
    }
  }

  function playStockfish() {
    toast.show('Coming soon');
  }

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>New Game</Text>

        <Text style={styles.sectionLabel}>Time Control</Text>
        <TimeControlSelector selected={timeControl} onSelect={setTimeControl} />
        <GameSettings
          rated={rated}
          ratingRange={ratingRange}
          color={color}
          onChangeColor={setColor}
          canPlayRated={!isGuest}
          onChangeRated={setChosenRated}
          onChangeRatingRange={setRatingRange}
        />

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
            onPress={challengeFriend}
            onDisabledPress={challengeFriend}
            appearsDisabled={isGuest}
            variant="outline"
            icon="sword-cross"
            style={styles.secondaryButtonSpacing}
            testID="challenge-friend-button"
          />
          <Button
            label="Play Stockfish"
            onDisabledPress={playStockfish}
            appearsDisabled
            variant="outline"
            icon="robot-outline"
            testID="play-stockfish-button"
          />
        </View>
      </View>
      <Toast toasts={toast.toasts} />
    </View>
  );
};

export default NewGame;

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    // Under the header, which keeps clear of the status bar itself.
    paddingTop: t.spacing.sm,
    paddingHorizontal: t.spacing.xl,
  },
  title: {
    fontSize: t.fontSize.h1,
    fontWeight: t.fontWeight.bold,
    marginBottom: t.spacing.xxl,
  },
  sectionLabel: {
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.semibold,
    color: t.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: t.spacing.md,
  },
  startButton: {
    marginTop: t.spacing.xl,
  },
  secondaryRow: {
    marginTop: t.spacing.md,
  },
  secondaryButtonSpacing: {
    marginBottom: t.spacing.md,
  },
}));
