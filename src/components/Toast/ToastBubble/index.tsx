import { Animated, Text } from 'react-native';

import { useToastBubbleAnimation } from '../../../hooks/useToastBubbleAnimation';
import { makeStyles } from '../../../theme';

export interface ToastBubbleProps {
  message: string;
}

const ToastBubble: React.FC<ToastBubbleProps> = ({ message }) => {
  const styles = useStyles();

  const { opacity, translateY } = useToastBubbleAnimation();

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

export default ToastBubble;

const useStyles = makeStyles((t) => ({
  text: {
    backgroundColor: t.colors.overlay,
    color: t.colors.onOverlay,
    fontSize: t.fontSize.md,
    fontWeight: t.fontWeight.medium,
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radius.xl,
    overflow: 'hidden',
    marginTop: t.spacing.sm,
  },
}));
