import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

// Counted as active unless it's known not to be: iOS can report 'unknown'
// before its first change, with the app plainly in front.
function isActive(state: AppStateStatus | string | null): boolean {
  return state !== 'background' && state !== 'inactive';
}

// Whether the app is in the foreground - work like an engine search pauses
// while it isn't.
export function useAppIsActive(): boolean {
  const [active, setActive] = useState(() => isActive(AppState.currentState));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) =>
      setActive(isActive(state)),
    );
    return () => subscription.remove();
  }, []);
  return active;
}
