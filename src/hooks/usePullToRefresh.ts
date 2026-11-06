import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * A list's pull to refresh: `onRefresh` runs every reload given at once,
 * `refreshing` until the last has finished - for a `RefreshControl`.
 */
export function usePullToRefresh(
  ...reloads: (() => Promise<unknown> | void)[]
): { refreshing: boolean; onRefresh: () => void } {
  const [refreshing, setRefreshing] = useState(false);
  const latestReloads = useRef(reloads);
  useLayoutEffect(() => {
    latestReloads.current = reloads;
  });
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.allSettled(latestReloads.current.map((reload) => reload())).then(
      () => setRefreshing(false),
    );
  }, []);
  return { refreshing, onRefresh };
}
