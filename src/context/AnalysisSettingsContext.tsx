import { createContext, useContext } from 'react';

import {
  AnalysisSettingsState,
  useAnalysisSettings,
} from '../hooks/useAnalysisSettings';

const AnalysisSettingsContext = createContext<AnalysisSettingsState | null>(
  null,
);

// The analysis settings, shared by the analysis board and the settings
// screen opened over it - a change there shows on the board on the way back.
export const AnalysisSettingsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const settings = useAnalysisSettings();
  return (
    <AnalysisSettingsContext.Provider value={settings}>
      {children}
    </AnalysisSettingsContext.Provider>
  );
};

export function useAnalysisSettingsContext(): AnalysisSettingsState {
  const context = useContext(AnalysisSettingsContext);
  if (!context) {
    throw new Error(
      'useAnalysisSettingsContext must be used within an AnalysisSettingsProvider',
    );
  }
  return context;
}
