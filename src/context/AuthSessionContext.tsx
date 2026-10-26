import { createContext, useContext } from 'react';

import {
  AuthSession,
  useAuthSessionLifecycle,
} from '../hooks/useAuthSessionLifecycle';

const AuthSessionContext = createContext<AuthSession | null>(null);

export const AuthSessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const session = useAuthSessionLifecycle();
  return (
    <AuthSessionContext.Provider value={session}>
      {children}
    </AuthSessionContext.Provider>
  );
};

export function useAuthSession(): AuthSession {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error(
      'useAuthSession must be used within an AuthSessionProvider',
    );
  }
  return context;
}
