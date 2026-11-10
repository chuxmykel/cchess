import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

import { makeStyles } from '../../theme';

const DOTS = 3;
const STEP_MS = 160;

// Three dots in a bubble, rising and fading in turn - the other person is
// typing.
const TypingIndicator: React.FC<{ name: string }> = ({ name }) => {
  const styles = useStyles();
  const [phases] = useState(() =>
    Array.from({ length: DOTS }, () => new Animated.Value(0)),
  );

  useEffect(() => {
    const loop = Animated.loop(
      Animated.stagger(
        STEP_MS,
        phases.map((phase) =>
          Animated.sequence([
            Animated.timing(phase, {
              toValue: 1,
              duration: STEP_MS * 2,
              useNativeDriver: true,
            }),
            Animated.timing(phase, {
              toValue: 0,
              duration: STEP_MS * 2,
              useNativeDriver: true,
            }),
          ]),
        ),
      ),
    );
    loop.start();
    return () => loop.stop();
  }, [phases]);

  return (
    <View
      style={styles.bubble}
      accessibilityLabel={`${name} is typing`}
      accessibilityLiveRegion="polite"
      testID="typing-indicator"
    >
      {phases.map((phase, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              opacity: phase.interpolate({
                inputRange: [0, 1],
                outputRange: [0.35, 1],
              }),
              transform: [
                {
                  translateY: phase.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -3],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

export default TypingIndicator;

const useStyles = makeStyles((t) => ({
  bubble: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: t.spacing.xs,
    paddingVertical: t.spacing.md,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surfaceStrong,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: t.colors.textMuted,
  },
}));
