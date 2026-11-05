import { useState } from 'react';
import { View, Text } from 'react-native';

import Button from '../../components/Button';
import GameSettings from '../../components/GameSettings';
import TimeControlSelector from '../../components/TimeControlSelector';
import Toast from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { useAuthSession } from '../../context/AuthSessionContext';
import { DEFAULT_RATING_RANGE, Seek } from '../../constants/seek';
import { DAILY_SEEK_FAILED_MESSAGE } from '../../constants/errorMessages';
import { useSeekDailyGame } from '../../hooks/useSeekDailyGame';
import { ColorChoice } from '../../network/socketEvents';
import {
  TimeControl,
  DEFAULT_TIME_CONTROL,
  daysPerMove,
  isDailyTimeControl,
  TIME_CONTROL_GROUPS,
} from '../../constants/timeControls';
import { makeStyles } from '../../theme';

// What a daily game starts at, when New Game is opened to start one.
const DEFAULT_DAILY_TIME_CONTROL = TIME_CONTROL_GROUPS.find(
  (group) => group.type === 'daily',
)!.options[2];

interface NewGameProps {
  navigation: {
    navigate: (route: string, params?: object) => any;
  };
  route?: { params?: { daily?: boolean } };
}

const NewGame: React.FC<NewGameProps> = ({ navigation, route }) => {
  const styles = useStyles();

  const [timeControl, setTimeControl] = useState<TimeControl>(
    route?.params?.daily ? DEFAULT_DAILY_TIME_CONTROL : DEFAULT_TIME_CONTROL,
  );
  const [chosenRated, setChosenRated] = useState(true);
  const [ratingRange, setRatingRange] = useState(DEFAULT_RATING_RANGE);
  const [color, setColor] = useState<ColorChoice>('random');
  const toast = useToast();
  const authSession = useAuthSession();
  const isGuest = !authSession.isReady || authSession.user.isGuest;
  const rated = !isGuest && chosenRated;
  const seekDailyGame = useSeekDailyGame();
  const [isSeekingDaily, setIsSeekingDaily] = useState(false);

  function startNewGame() {
    if (isDailyTimeControl(timeControl)) {
      startDailyGame();
      return;
    }
    const seek: Seek = { timeControl, rated, ratingRange, color };
    navigation.navigate('LiveGame', { seek });
  }

  // A daily seek is posted and left: matched at once, the game opens;
  // otherwise it waits on Home, under Your games, for an opponent.
  async function startDailyGame() {
    if (isSeekingDaily) return;
    setIsSeekingDaily(true);
    try {
      const outcome = await seekDailyGame({
        days: daysPerMove(timeControl),
        rated,
        ratingRange,
        color,
      });
      if (outcome.status === 'matched') {
        navigation.navigate('DailyGame', { gameId: outcome.gameId });
      } else {
        navigation.navigate('Home');
      }
    } catch (error) {
      toast.show((error as Error).message || DAILY_SEEK_FAILED_MESSAGE);
    } finally {
      setIsSeekingDaily(false);
    }
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
          disabled={isSeekingDaily}
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
    color: t.colors.text,
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
