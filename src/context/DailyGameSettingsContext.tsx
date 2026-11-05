import { createContext, useContext } from 'react';

import {
  DailyGameSettingsState,
  useDailyGameSettings,
} from '../hooks/useDailyGameSettings';

const DailyGameSettingsContext = createContext<DailyGameSettingsState | null>(
  null,
);

// Daily games' settings, shared by the daily game and the settings screen
// opened over it - a change there holds on the way back.
export const DailyGameSettingsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const settings = useDailyGameSettings();
  return (
    <DailyGameSettingsContext.Provider value={settings}>
      {children}
    </DailyGameSettingsContext.Provider>
  );
};

export function useDailyGameSettingsContext(): DailyGameSettingsState {
  const context = useContext(DailyGameSettingsContext);
  if (!context) {
    throw new Error(
      'useDailyGameSettingsContext must be used within a DailyGameSettingsProvider',
    );
  }
  return context;
}
