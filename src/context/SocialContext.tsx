import { createContext, useContext } from 'react';

import { GameType } from '../domain/types';
import { Social, useSocial } from '../hooks/useSocial';

const SocialContext = createContext<Social | null>(null);

export const SocialProvider: React.FC<{
  onGameStarted: (gameId: string, gameType: GameType) => void;
  children: React.ReactNode;
}> = ({ onGameStarted, children }) => {
  const social = useSocial(onGameStarted);
  return (
    <SocialContext.Provider value={social}>{children}</SocialContext.Provider>
  );
};

/** The social state where there is one - null outside a SocialProvider,
 * for something optional on a screen that can be shown without it (a
 * game's "Send to a friend", in a test of the game alone). */
export function useOptionalSocialContext(): Social | null {
  return useContext(SocialContext);
}

export function useSocialContext(): Social {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocialContext must be used within a SocialProvider');
  }
  return context;
}
