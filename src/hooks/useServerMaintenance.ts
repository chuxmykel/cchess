import { useEffect, useMemo, useRef, useState } from 'react';

import { getMaintenance } from '../network/restClient';
import { AppSocket } from '../network/socketClient';
import { MaintenanceStatus } from '../network/socketEvents';

/**
 * When the server's announced maintenance is set to begin - no new live
 * game starts from the announcement until it ends, and once it's begun and
 * the live games in progress finish, the server restarts - or null with
 * none announced. Asked of the server on launch and on every reconnect (a
 * restart forgets it, and a push sent while away is missed), and kept
 * current by its `server:maintenance` pushes.
 */
export function useServerMaintenance(socket: AppSocket | null): Date | null {
  const [startsAt, setStartsAt] = useState<string | null>(null);
  // Counts what's been heard, so an answer to an older request doesn't
  // overwrite a push that came after it was sent.
  const heard = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const show = ({ startsAt: next }: MaintenanceStatus) => {
      heard.current += 1;
      setStartsAt(next);
    };
    const fetchStatus = () => {
      const asked = heard.current;
      getMaintenance().then(
        (status) => {
          if (!cancelled && heard.current === asked) show(status);
        },
        // Unreachable: nothing new to show, and the next reconnect asks again.
        () => {},
      );
    };

    fetchStatus();
    if (!socket) {
      return () => {
        cancelled = true;
      };
    }
    socket.on('server:maintenance', show);
    socket.on('connect', fetchStatus);
    return () => {
      cancelled = true;
      socket.off('server:maintenance', show);
      socket.off('connect', fetchStatus);
    };
  }, [socket]);

  // The same Date until it changes, so a context giving it out doesn't
  // re-render everything under it on every render of its own.
  return useMemo(() => (startsAt ? new Date(startsAt) : null), [startsAt]);
}
