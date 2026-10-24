import { createContext, useContext } from 'react';

import {
  useAuthSessionBootstrap,
  AuthSessionState,
} from '../hooks/useAuthSessionBootstrap';

const AuthSessionContext = createContext<AuthSessionState | null>(null);

export const AuthSessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const state = useAuthSessionBootstrap();
  return (
    <AuthSessionContext.Provider value={state}>
      {children}
    </AuthSessionContext.Provider>
  );
};

export function useAuthSession(): AuthSessionState {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error(
      'useAuthSession must be used within an AuthSessionProvider',
    );
  }
  return context;
}
