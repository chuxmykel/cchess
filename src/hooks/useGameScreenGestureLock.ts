import { useEffect } from 'react';
import { BackHandler } from 'react-native';

type GestureLockNavigation = {
  setOptions: (options: { gestureEnabled: boolean }) => void;
};

// Keeps the Game screen's native-stack swipe-back gesture locked while a
// game is in progress, and re-enables it once the game ends - a player
// shouldn't be able to swipe away from a live game. Android's back button
// and back gesture are refused the same way: they go through BackHandler,
// not the stack's gesture (iOS never sends it anything).
export function useGameScreenGestureLock(
  navigation: GestureLockNavigation,
  isGameOver: boolean,
): void {
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: isGameOver });
  }, [navigation, isGameOver]);

  useEffect(() => {
    if (isGameOver) return;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    return () => subscription.remove();
  }, [isGameOver]);
}
