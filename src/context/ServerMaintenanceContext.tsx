import { createContext, useContext } from 'react';

import { useAuthSession } from './AuthSessionContext';
import { useServerMaintenance } from '../hooks/useServerMaintenance';

const ServerMaintenanceContext = createContext<Date | null>(null);

/** Mounted in HomeStack, so it's heard from launch, whichever screen a
 * game is then opened on. */
export const ServerMaintenanceProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const session = useAuthSession();
  const startsAt = useServerMaintenance(
    session.isReady ? session.socket : null,
  );
  return (
    <ServerMaintenanceContext.Provider value={startsAt}>
      {children}
    </ServerMaintenanceContext.Provider>
  );
};

/** When the server's maintenance is set to begin, or null with none
 * announced -
 * and outside a provider (a screen rendered alone in a test). */
export function useServerMaintenanceStartsAt(): Date | null {
  return useContext(ServerMaintenanceContext);
}
