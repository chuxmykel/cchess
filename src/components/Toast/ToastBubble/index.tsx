import { Animated, Text, StyleSheet } from 'react-native';

import { useToastBubbleAnimation } from '../../../hooks/useToastBubbleAnimation';

export interface ToastBubbleProps {
  message: string;
}

const ToastBubble: React.FC<ToastBubbleProps> = ({ message }) => {
  const { opacity, translateY } = useToastBubbleAnimation();

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

export default ToastBubble;

const styles = StyleSheet.create({
  text: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 6,
  },
});
