import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';

export type RunAfterDismiss = {
  runAfterDismiss: (action: () => void) => void;
  handleDismiss: () => void;
};

export function useRunAfterDismiss(): RunAfterDismiss {
  const pendingAction = useRef<(() => void) | null>(null);

  const runAfterDismiss = useCallback((action: () => void) => {
    if (Platform.OS !== 'ios') {
      action();
      return;
    }
    pendingAction.current = action;
  }, []);

  const handleDismiss = useCallback(() => {
    const action = pendingAction.current;
    pendingAction.current = null;
    action?.();
  }, []);

  return { runAfterDismiss, handleDismiss };
}
