import { useCallback, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { acceptTerms } from '../network/restClient';

export type TermsAcceptance = {
  /** A signed-in account that hasn't accepted the terms in force - an
   * older server says nothing, and isn't asked about. */
  needsAcceptance: boolean;
  accept: () => Promise<void>;
  isAccepting: boolean;
  error: string | null;
};

export function useTermsAcceptance(): TermsAcceptance {
  const session = useAuthSession();
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authorized, reloadUser } = session;
  const needsAcceptance =
    session.isReady &&
    !session.user.isGuest &&
    session.user.termsAccepted === false;

  const accept = useCallback(async () => {
    setIsAccepting(true);
    setError(null);
    try {
      await authorized(acceptTerms);
      await reloadUser();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setIsAccepting(false);
    }
  }, [authorized, reloadUser]);

  return { needsAcceptance, accept, isAccepting, error };
}
