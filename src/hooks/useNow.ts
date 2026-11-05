import { useEffect, useState } from 'react';

/** The time now, as epoch ms, read again every `intervalMs` - for showing
 * how long is left until something, without a clock of its own. */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);
  return now;
}
