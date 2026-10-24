import { useEffect } from 'react';

type GestureLockNavigation = {
  setOptions: (options: { gestureEnabled: boolean }) => void;
};

// Keeps the Game screen's native-stack swipe-back gesture locked while a
// game is in progress, and re-enables it once the game ends - a player
// shouldn't be able to swipe away from a live game.
export function useGameScreenGestureLock(
  navigation: GestureLockNavigation,
  isGameOver: boolean,
): void {
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: isGameOver });
  }, [navigation, isGameOver]);
}
