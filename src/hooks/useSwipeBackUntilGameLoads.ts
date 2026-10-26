import { useEffect } from 'react';

type SwipeBackNavigation = {
  setOptions: (options: { gestureEnabled: boolean }) => void;
};

export function useSwipeBackUntilGameLoads(
  navigation: SwipeBackNavigation,
  isGameLoaded: boolean,
): void {
  useEffect(() => {
    if (!isGameLoaded) {
      navigation.setOptions({ gestureEnabled: true });
    }
  }, [navigation, isGameLoaded]);
}
