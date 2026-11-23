import { useEffect, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { verifyEmail } from '../network/restClient';

export type EmailVerification =
  | { status: 'verifying' }
  | { status: 'verified'; email: string }
  | { status: 'failed'; message: string };

/** Uses a verify (or change of address) link's token once, as the screen
 * it opened appears - and reloads the account, whose email it changed. */
export function useEmailVerification(token: string): EmailVerification {
  const session = useAuthSession();
  const { reloadUser } = session;
  const isSignedIn = session.isReady && !session.user.isGuest;
  const [state, setState] = useState<EmailVerification>({
    status: 'verifying',
  });

  useEffect(() => {
    let isCurrent = true;
    verifyEmail(token)
      .then(({ email }) => {
        if (!isCurrent) return;
        setState({ status: 'verified', email });
        if (isSignedIn) reloadUser().catch(() => {});
      })
      .catch((error: Error) => {
        if (isCurrent) setState({ status: 'failed', message: error.message });
      });
    return () => {
      isCurrent = false;
    };
    // Once per token: a reloaded account mustn't use the link again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return state;
}
