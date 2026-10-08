import { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ToastItem } from '../../hooks/useToast';

interface ToastProps {
  toasts: ToastItem[];
}

const Toast: React.FC<ToastProps> = ({ toasts }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { bottom: insets.bottom + 24 }]}
    >
      {toasts.map((toast) => (
        <ToastBubble key={toast.id} message={toast.message} />
      ))}
    </View>
  );
};

export default Toast;

interface ToastBubbleProps {
  message: string;
}

const ToastBubble: React.FC<ToastBubbleProps> = ({ message }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
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
