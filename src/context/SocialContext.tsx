import { createContext, useContext } from 'react';

import { Social, useSocial } from '../hooks/useSocial';

const SocialContext = createContext<Social | null>(null);

export const SocialProvider: React.FC<{
  onGameStarted: (gameId: string) => void;
  children: React.ReactNode;
}> = ({ onGameStarted, children }) => {
  const social = useSocial(onGameStarted);
  return (
    <SocialContext.Provider value={social}>{children}</SocialContext.Provider>
  );
};

export function useSocialContext(): Social {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocialContext must be used within a SocialProvider');
  }
  return context;
}
