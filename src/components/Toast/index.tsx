import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ToastItem } from '../../hooks/useToast';

import ToastBubble from './ToastBubble';

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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
});
