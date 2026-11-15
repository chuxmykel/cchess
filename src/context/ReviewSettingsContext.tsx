import { createContext, useContext } from 'react';

import {
  ReviewSettingsState,
  useReviewSettings,
} from '../hooks/useReviewSettings';

const ReviewSettingsContext = createContext<ReviewSettingsState | null>(null);

// The game review's settings, shared by the review and the settings screen
// opened over it - a change there holds on the way back.
export const ReviewSettingsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const settings = useReviewSettings();
  return (
    <ReviewSettingsContext.Provider value={settings}>
      {children}
    </ReviewSettingsContext.Provider>
  );
};

export function useReviewSettingsContext(): ReviewSettingsState {
  const context = useContext(ReviewSettingsContext);
  if (!context) {
    throw new Error(
      'useReviewSettingsContext must be used within a ReviewSettingsProvider',
    );
  }
  return context;
}
